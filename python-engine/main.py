from __future__ import annotations

import os
from datetime import datetime
from urllib.parse import parse_qs, urlparse

import numpy as np
import pandas as pd
import psycopg2
from fastapi import FastAPI, HTTPException

from outfit_config import EMBEDDING_SIMILARITY_WEIGHT
from outfit_engine import (
    GROUND_TRUTH_OUTFITS,
    UltimateColorAndStyleStrictRecommender,
)
from product_loader import load_products

app = FastAPI()

df: pd.DataFrame | None = None
embeddings: np.ndarray | None = None
recommender: UltimateColorAndStyleStrictRecommender | None = None
visual_build_stats: dict | None = None
last_loaded_at: datetime | None = None
last_db_updated_at: datetime | None = None

SKIP_VISUAL_EMBEDDINGS = os.environ.get("SKIP_VISUAL_EMBEDDINGS", "").lower() in (
    "1",
    "true",
    "yes",
    "on",
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


def _build_clip_embeddings(prepared_df: pd.DataFrame, db_max_updated: datetime | None) -> np.ndarray:
    from visual_embeddings import VISUAL_MODEL_NAME, build_visual_embeddings

    global visual_build_stats
    matrix, visual_build_stats = build_visual_embeddings(prepared_df, db_max_updated)
    print(f"CLIP embeddings ready (model={VISUAL_MODEL_NAME}, stats={visual_build_stats})")
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
        "embedding": "visual",
        "outfit_roles": outfit_roles,
        "recommendations": recommendations,
    }


@app.on_event("startup")
def load_data() -> None:
    global df, embeddings, recommender, visual_build_stats
    global last_loaded_at, last_db_updated_at

    try:
        print("Loading products from database...")
        raw_df = load_products(include_updated_at=True, include_image=True)
        df = raw_df

        db_max_updated = None
        if "updated_at" in df.columns and not df["updated_at"].isna().all():
            try:
                db_max_updated = pd.to_datetime(df["updated_at"]).max().to_pydatetime()
            except Exception:
                db_max_updated = None

        recommender = None
        embeddings = None
        visual_build_stats = None

        if not SKIP_VISUAL_EMBEDDINGS:
            embeddings = _build_clip_embeddings(df, db_max_updated)
            recommender = UltimateColorAndStyleStrictRecommender(
                df,
                embeddings,
                GROUND_TRUTH_OUTFITS,
                similarity_weight=EMBEDDING_SIMILARITY_WEIGHT,
            )

        last_loaded_at = datetime.utcnow()
        last_db_updated_at = db_max_updated
        print(f"Outfit engine ready — {len(df)} products (CLIP, -1 product images).")
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
    from visual_embeddings import VISUAL_MODEL_NAME

    return {
        "status": "ok" if recommender is not None else "loading",
        "products": len(df) if df is not None else 0,
        "embedding_model": VISUAL_MODEL_NAME,
        "embeddings_loaded": recommender is not None,
        "image_variant": "primary-1",
        "visual_build_stats": visual_build_stats,
        "similarity_weight": EMBEDDING_SIMILARITY_WEIGHT,
        "last_loaded_at": last_loaded_at.isoformat() if last_loaded_at else None,
    }


@app.post("/sync")
def sync_data() -> dict:
    load_data()
    return {
        "message": "Data synchronized from database",
        "count": len(df) if df is not None else 0,
        "embeddings_loaded": recommender is not None,
    }


@app.get("/recommend")
def recommend(product_id: int, limit: int | None = None) -> dict:
    if df is None or recommender is None:
        raise HTTPException(status_code=500, detail="Outfit engine not loaded")

    _maybe_refresh_from_db()

    outfit = recommender.generate_outfit(product_id)
    if isinstance(outfit, str):
        raise HTTPException(status_code=404, detail=outfit)

    payload = _outfit_to_response(product_id, outfit)
    if limit is not None and limit > 0:
        payload["recommendations"] = payload["recommendations"][:limit]
    return payload
