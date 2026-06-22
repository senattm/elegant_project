from __future__ import annotations

import os
import threading
from datetime import datetime

import pandas as pd
import psycopg2
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from outfit_config import OUTFIT_COMPLEMENT_CFG
from product_loader import catalog_polyvore_only, database_url, load_products, load_seed_products

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

df: pd.DataFrame | None = None
engine_ready = False
last_loaded_at: datetime | None = None
last_db_updated_at: datetime | None = None


@app.on_event("startup")
def load_data() -> None:
    global df, engine_ready, last_loaded_at, last_db_updated_at

    try:
        print("Loading products from database...")
        df = load_products(include_updated_at=True, include_image=True)

        db_max_updated = None
        if "updated_at" in df.columns and not df["updated_at"].isna().all():
            try:
                db_max_updated = pd.to_datetime(df["updated_at"]).max().to_pydatetime()
            except Exception:
                db_max_updated = None

        engine_ready = True
        last_loaded_at = datetime.utcnow()
        last_db_updated_at = db_max_updated
        print(f"Python engine ready — {len(df)} products.")

        def _warmup() -> None:
            try:
                from cir_engine import CIR_IDS_PATH, precompute_catalog, reset_elegant_failed_ids
                from model_loader import load_model

                model = load_model(model_type="clip")
                print("[Warm-up] Model bellege yuklendi.")

                if not catalog_polyvore_only():
                    cleared = reset_elegant_failed_ids()
                    if cleared:
                        print(f"[Warm-up] {cleared} Elegant urun failed-list'ten temizlendi.")

                df_img = load_products(include_image=True, polyvore_only=catalog_polyvore_only())
                if not CIR_IDS_PATH.is_file():
                    print("[Warm-up] CIR katalog indexi olusturuluyor…")
                    precompute_catalog(df_img, model)
                    print("[Warm-up] CIR katalog indexi hazir.")
                else:
                    precompute_catalog(df_img, model)
                    print("[Warm-up] CIR embeddingler cache'den yuklendi.")
            except Exception as exc:
                print(f"[Warm-up] Hata (sorun degil): {exc}")

        threading.Thread(target=_warmup, daemon=True).start()

    except Exception as exc:
        print(f"Error loading engine: {exc}")


def _maybe_refresh_from_db() -> None:
    if os.environ.get("AUTO_REFRESH", "true").lower() not in ("1", "true", "yes", "on"):
        return

    try:
        conn = psycopg2.connect(database_url())
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
        "status": "ok" if engine_ready else "loading",
        "products": len(df) if df is not None else 0,
        "engine": "elegant_cir",
        "outfit_complement": OUTFIT_COMPLEMENT_CFG,
        "last_loaded_at": last_loaded_at.isoformat() if last_loaded_at else None,
    }


@app.post("/sync")
def sync_data() -> dict:
    load_data()
    return {
        "message": "Data synchronized from database",
        "count": len(df) if df is not None else 0,
    }


@app.get("/complement")
def complement_items(product_ids: str, category: str = "", k: int = 8):
    _maybe_refresh_from_db()

    try:
        seed_ids = [int(x.strip()) for x in product_ids.split(",") if x.strip()]
    except ValueError:
        raise HTTPException(status_code=400, detail="product_ids sayisal olmali")

    if not seed_ids:
        raise HTTPException(status_code=400, detail="En az bir product_id gerekli")

    try:
        from model_loader import _model_cache, load_model

        if "clip" not in _model_cache:
            raise HTTPException(
                status_code=503,
                detail="__loading__:Model yukleniyor, lutfen birkac saniye bekleyin.",
            )
        model = load_model(model_type="clip")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Model yuklenemedi: {exc}")

    try:
        df_with_img = load_products(include_image=True, polyvore_only=catalog_polyvore_only())
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Urunler yuklenemedi: {exc}")

    try:
        from cir_engine import CIR_IDS_PATH, find_complementary

        if not CIR_IDS_PATH.is_file():
            raise HTTPException(
                status_code=503,
                detail="__loading__:CIR katalogu indeksleniyor, birkac dakika sonra tekrar deneyin.",
            )
        recs = find_complementary(
            seed_ids,
            df_with_img,
            model,
            category=category,
            k=k,
            outfit_mode=(category == ""),
            seed_df=load_seed_products(seed_ids),
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"CIR hatasi: {exc}")

    if not recs:
        return {"items": [], "seed_ids": seed_ids, "engine": "elegant_cir"}

    items = [{"id": r["id"]} for r in recs]

    return {
        "items": items,
        "seed_ids": seed_ids,
        "engine": "elegant_cir",
    }


@app.post("/cir/precompute")
def cir_precompute(force: bool = False):
    try:
        from cir_engine import precompute_catalog
        from model_loader import load_model

        model = load_model(model_type="clip")
        df_with_img = load_products(include_image=True, polyvore_only=catalog_polyvore_only())
        ids, _, item_embs = precompute_catalog(df_with_img, model, force=force)
        return {
            "status": "ok",
            "products_indexed": len(ids),
            "embedding_shape": list(item_embs.shape),
        }
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Precompute hatasi: {exc}")


@app.get("/cir/status")
def cir_status():
    from cir_engine import catalog_status

    return catalog_status()
