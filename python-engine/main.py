from __future__ import annotations

import os
from datetime import datetime
from urllib.parse import parse_qs, urlparse

import numpy as np
import pandas as pd
import psycopg2
from fastapi import FastAPI, HTTPException
from sentence_transformers import SentenceTransformer

from outfit_engine import (
    GROUND_TRUTH_OUTFITS,
    UltimateColorAndStyleStrictRecommender,
    prepare_products_dataframe,
)

app = FastAPI()

df: pd.DataFrame | None = None
embeddings: np.ndarray | None = None
recommender: UltimateColorAndStyleStrictRecommender | None = None
embedding_model: SentenceTransformer | None = None
last_loaded_at: datetime | None = None
last_db_updated_at: datetime | None = None

EMBEDDING_MODEL_NAME = os.environ.get(
    "EMBEDDING_MODEL", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
)
EMBEDDINGS_CACHE_PATH = os.environ.get(
    "EMBEDDINGS_CACHE_PATH",
    os.path.join(os.path.dirname(__file__), "data", "product_embeddings.npy"),
)
EMBEDDINGS_META_PATH = os.environ.get(
    "EMBEDDINGS_META_PATH",
    os.path.join(os.path.dirname(__file__), "data", "embeddings_meta.txt"),
)


def _database_url() -> str:
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        return "postgresql://postgres:123456@localhost:5432/elegant_db"
    parsed = urlparse(database_url)
    if parsed.query:
        params = parse_qs(parsed.query)
        if "schema" in params and len(params) == 1:
            return database_url.split("?")[0]
    return database_url


def _load_embedding_model() -> SentenceTransformer:
    global embedding_model
    if embedding_model is None:
        print(f"Loading embedding model: {EMBEDDING_MODEL_NAME}")
        embedding_model = SentenceTransformer(EMBEDDING_MODEL_NAME)
    return embedding_model


def _read_embeddings_cache(product_count: int, db_max_updated: datetime | None) -> np.ndarray | None:
    if not os.path.isfile(EMBEDDINGS_CACHE_PATH) or not os.path.isfile(EMBEDDINGS_META_PATH):
        return None
    try:
        with open(EMBEDDINGS_META_PATH, encoding="utf-8") as f:
            meta = f.read().strip().split("|")
        cached_count = int(meta[0])
        cached_updated = meta[1] if len(meta) > 1 and meta[1] != "none" else None
        current_updated = (
            db_max_updated.isoformat() if db_max_updated is not None else "none"
        )
        if cached_count != product_count or cached_updated != current_updated:
            return None
        arr = np.load(EMBEDDINGS_CACHE_PATH)
        if arr.shape[0] != product_count:
            return None
        print(f"Loaded cached embeddings ({arr.shape})")
        return arr
    except Exception as exc:
        print(f"Embedding cache read failed: {exc}")
        return None


def _write_embeddings_cache(
    matrix: np.ndarray, product_count: int, db_max_updated: datetime | None
) -> None:
    os.makedirs(os.path.dirname(EMBEDDINGS_CACHE_PATH), exist_ok=True)
    np.save(EMBEDDINGS_CACHE_PATH, matrix)
    updated = db_max_updated.isoformat() if db_max_updated is not None else "none"
    with open(EMBEDDINGS_META_PATH, "w", encoding="utf-8") as f:
        f.write(f"{product_count}|{updated}")


def _build_embeddings(prepared_df: pd.DataFrame, db_max_updated: datetime | None) -> np.ndarray:
    cached = _read_embeddings_cache(len(prepared_df), db_max_updated)
    if cached is not None:
        return cached

    model = _load_embedding_model()
    print("Encoding product text profiles...")
    matrix = model.encode(
        prepared_df["text_profile"].tolist(),
        show_progress_bar=False,
        convert_to_numpy=True,
    )
    _write_embeddings_cache(matrix, len(prepared_df), db_max_updated)
    return matrix


def _outfit_to_response(product_id: int, outfit: dict) -> dict:
    outfit_roles: dict[str, int] = {}
    recommendations: list[int] = []

    for role, item in outfit.items():
        pid = int(item["id"])
        outfit_roles[role] = pid
        if role != "seed":
            recommendations.append(pid)

    return {
        "product_id": product_id,
        "outfit_roles": outfit_roles,
        "recommendations": recommendations,
    }


@app.on_event("startup")
def load_data() -> None:
    global df, embeddings, recommender, last_loaded_at, last_db_updated_at

    try:
        print("Loading products from database...")
        conn = psycopg2.connect(_database_url())
        query = """
            SELECT id, name, description, brand, colors, gender, season, tags, updated_at
            FROM products
        """
        raw_df = pd.read_sql(query, conn)
        conn.close()

        df = prepare_products_dataframe(raw_df)

        db_max_updated = None
        if "updated_at" in df.columns and not df["updated_at"].isna().all():
            try:
                db_max_updated = pd.to_datetime(df["updated_at"]).max().to_pydatetime()
            except Exception:
                db_max_updated = None

        embeddings = _build_embeddings(df, db_max_updated)
        recommender = UltimateColorAndStyleStrictRecommender(
            df, embeddings, GROUND_TRUTH_OUTFITS
        )
        last_loaded_at = datetime.utcnow()
        last_db_updated_at = db_max_updated
        print(f"Outfit engine ready — {len(df)} products loaded.")
    except Exception as exc:
        print(f"Error loading outfit engine: {exc}")


def _maybe_refresh_from_db() -> None:
    if os.environ.get("AUTO_REFRESH", "true").lower() not in ("1", "true", "yes", "on"):
        return

    try:
        conn = psycopg2.connect(_database_url())
        cur = conn.cursor()
        cur.execute("SELECT MAX(updated_at) FROM products")
        row = cur.fetchone()
        cur.close()
        conn.close()

        current_max = row[0] if row else None
        if current_max and (last_db_updated_at is None or current_max > last_db_updated_at):
            load_data()
    except Exception:
        return


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok" if recommender is not None else "loading",
        "products": len(df) if df is not None else 0,
        "last_loaded_at": last_loaded_at.isoformat() if last_loaded_at else None,
    }


@app.post("/sync")
def sync_data() -> dict:
    load_data()
    return {"message": "Data synchronized from database", "count": len(df) if df is not None else 0}


@app.get("/recommend")
def recommend(product_id: int, limit: int | None = None) -> dict:
    if recommender is None or df is None:
        raise HTTPException(status_code=500, detail="Outfit engine not loaded")

    _maybe_refresh_from_db()

    outfit = recommender.generate_outfit(product_id)
    if isinstance(outfit, str):
        raise HTTPException(status_code=404, detail=outfit)

    payload = _outfit_to_response(product_id, outfit)
    if limit is not None and limit > 0:
        payload["recommendations"] = payload["recommendations"][:limit]
    return payload
