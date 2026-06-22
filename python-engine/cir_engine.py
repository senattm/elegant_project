from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Optional

import numpy as np
import torch

from outfit_config import OUTFIT_COMPLEMENT_CFG
from outfit_model.datatypes import (
    FashionCompatibilityQuery,
    FashionComplementaryQuery,
    FashionItem,
)
from paths import CIR_DATA_DIR, POLYVORE_IMAGES_DIR, PUBLIC_DIR

CIR_CLIP_EMB_PATH = CIR_DATA_DIR / "catalog_cir_clip.npy"
CIR_ITEM_EMB_PATH = CIR_DATA_DIR / "catalog_cir_items.npy"
CIR_IDS_PATH = CIR_DATA_DIR / "catalog_cir_ids.json"
CIR_FAILED_IDS_PATH = CIR_DATA_DIR / "catalog_cir_failed_ids.json"

_cache: dict = {}
_FAILED_URLS: set[str] = set()
_BACKEND_URL = os.environ.get("BACKEND_URL", "http://127.0.0.1:5000").rstrip("/")


def _normalize_source(raw: str | None) -> str:
    if raw is None:
        return "elegant"
    text = str(raw).strip().lower()
    if not text or text == "nan":
        return "elegant"
    if text == "polyvore":
        return "polyvore"
    return "elegant"


def _build_id_to_source(df) -> dict[int, str]:
    id_to_source: dict[int, str] = {}
    has_source_col = "source" in df.columns
    for _, row in df.iterrows():
        pid = int(row["id"])
        if has_source_col:
            id_to_source[pid] = _normalize_source(row.get("source"))
        else:
            url = str(row.get("image_url", "") or "")
            id_to_source[pid] = "polyvore" if "polyvore-images" in url else "elegant"
    return id_to_source


def _resolve_seed_source(
    pid: int,
    id_to_source: dict[int, str],
    seed_rows: dict[int, dict],
) -> str | None:
    if pid in id_to_source:
        return id_to_source[pid]
    row = seed_rows.get(pid)
    if row and row.get("source"):
        return _normalize_source(row["source"])
    return None


def _resolve_image_url(url: str) -> str:
    if not url:
        return ""
    if url.startswith("http://") or url.startswith("https://"):
        return url
    normalized = url.lstrip("/")
    return f"{_BACKEND_URL}/{normalized}"


def _load_image(url: str):
    if not url:
        return None
    if url in _FAILED_URLS:
        return None

    try:
        from PIL import Image

        if "polyvore-images" in url:
            fname = url.rsplit("/", 1)[-1]
            local = POLYVORE_IMAGES_DIR / fname
            if local.is_file():
                return Image.open(local).convert("RGB")

        normalized = url.lstrip("/")
        if normalized.startswith("images/"):
            local = PUBLIC_DIR / normalized
            if local.is_file():
                return Image.open(local).convert("RGB")

        import io
        import requests

        fetch_url = _resolve_image_url(url)
        response = requests.get(fetch_url, timeout=8)
        response.raise_for_status()
        return Image.open(io.BytesIO(response.content)).convert("RGB")
    except Exception:
        _FAILED_URLS.add(url)
        return None


def _embed_items(fashion_items: list, model) -> tuple[np.ndarray, np.ndarray]:
    batch_size = 16
    all_clip: list[np.ndarray] = []
    all_item: list[np.ndarray] = []

    for i in range(0, len(fashion_items), batch_size):
        batch = fashion_items[i : i + batch_size]
        with torch.no_grad():
            clip_batch = model.precompute_clip_embedding(batch)
            clip_np = clip_batch.cpu().numpy() if hasattr(clip_batch, "cpu") else np.array(clip_batch)
            items_with_emb = [FashionItem(embedding=clip_batch[j]) for j in range(len(batch))]
            item_batch = model.embed_item(items_with_emb, use_precomputed_embedding=True)
            item_np = item_batch.cpu().numpy()
        all_clip.append(clip_np)
        all_item.append(item_np)

    return (
        np.vstack(all_clip).astype(np.float32),
        np.vstack(all_item).astype(np.float32),
    )


def reset_elegant_failed_ids() -> int:
    """Elegant urunler icin eski basarisiz index kayitlarini temizle."""
    if not CIR_FAILED_IDS_PATH.is_file():
        return 0
    failed = set(json.loads(CIR_FAILED_IDS_PATH.read_text()))
    if not failed:
        return 0

    import psycopg2
    from product_loader import database_url

    conn = psycopg2.connect(database_url())
    cur = conn.cursor()
    cur.execute("SELECT id FROM products WHERE COALESCE(source, '') != 'polyvore'")
    elegant_ids = {row[0] for row in cur.fetchall()}
    conn.close()

    removed = failed & elegant_ids
    if removed:
        CIR_FAILED_IDS_PATH.write_text(json.dumps(sorted(failed - removed)))
    return len(removed)


def precompute_catalog(df, model, *, force: bool = False):
    global _cache

    if not force and _cache.get("ids") and _cache.get("clip_embs") is not None:
        return _cache["ids"], _cache["clip_embs"], _cache["item_embs"]

    db_rows: dict[int, dict] = {}
    for _, row in df.iterrows():
        url = str(row.get("image_url", "") or "")
        if url:
            db_rows[int(row["id"])] = {"url": url, "desc": str(row.get("name", "") or "")}

    db_ids = set(db_rows.keys())

    cached_ids: list[int] = []
    cached_clip: Optional[np.ndarray] = None
    cached_item: Optional[np.ndarray] = None

    if not force and CIR_IDS_PATH.is_file() and CIR_ITEM_EMB_PATH.is_file():
        cached_ids = json.loads(CIR_IDS_PATH.read_text())
        cached_item = np.load(CIR_ITEM_EMB_PATH)
        cached_clip = np.load(CIR_CLIP_EMB_PATH) if CIR_CLIP_EMB_PATH.is_file() else None

        if len(cached_ids) != len(cached_item):
            cached_ids, cached_item, cached_clip = [], None, None

    failed_ids: set[int] = set()
    if CIR_FAILED_IDS_PATH.is_file():
        failed_ids = set(json.loads(CIR_FAILED_IDS_PATH.read_text()))

    cached_id_set = set(cached_ids)

    keep_mask = [pid in db_ids for pid in cached_ids]
    removed = cached_id_set - db_ids
    if removed:
        keep_idx = [i for i, keep in enumerate(keep_mask) if keep]
        cached_ids = [cached_ids[i] for i in keep_idx]
        cached_item = cached_item[keep_idx] if cached_item is not None else None
        cached_clip = cached_clip[keep_idx] if cached_clip is not None else None
        print(f"[CIR] {len(removed)} silinen urun cache'den cikarildi.")

    current_id_set = set(cached_ids)
    new_ids = [pid for pid in db_ids if pid not in current_id_set and pid not in failed_ids]

    if new_ids:
        print(f"[CIR] {len(new_ids)} yeni urun icin embedding hesaplaniyor…")
        new_fashion_items: list = []
        valid_new_ids: list[int] = []
        for pid in new_ids:
            img = _load_image(db_rows[pid]["url"])
            if img is None:
                continue
            new_fashion_items.append(FashionItem(image=img, description=db_rows[pid]["desc"]))
            valid_new_ids.append(pid)
            if len(valid_new_ids) % 50 == 0:
                print(f"[CIR] Gorsel yuklendi: {len(valid_new_ids)}/{len(new_ids)}")

        newly_failed = set(new_ids) - set(valid_new_ids)
        if newly_failed:
            failed_ids |= newly_failed
            CIR_FAILED_IDS_PATH.parent.mkdir(parents=True, exist_ok=True)
            CIR_FAILED_IDS_PATH.write_text(json.dumps(sorted(failed_ids)))
            print(f"[CIR] {len(newly_failed)} urunun gorseli yuklenemedi, kalici olarak atlandi.")

        if new_fashion_items:
            new_clip, new_item = _embed_items(new_fashion_items, model)
            cached_ids = cached_ids + valid_new_ids
            cached_clip = np.vstack([cached_clip, new_clip]) if cached_clip is not None else new_clip
            cached_item = np.vstack([cached_item, new_item]) if cached_item is not None else new_item
            print(f"[CIR] {len(valid_new_ids)} yeni urun eklendi.")
    elif not removed:
        _cache.update({"ids": cached_ids, "clip_embs": cached_clip, "item_embs": cached_item})
        print(f"[CIR] Cache yuklendi: {len(cached_ids)} urun (degisiklik yok)")
        return cached_ids, cached_clip, cached_item

    ids = cached_ids
    clip_embs = cached_clip
    item_embs = cached_item

    CIR_IDS_PATH.parent.mkdir(parents=True, exist_ok=True)
    if clip_embs is not None:
        np.save(CIR_CLIP_EMB_PATH, clip_embs)
    np.save(CIR_ITEM_EMB_PATH, item_embs)
    CIR_IDS_PATH.write_text(json.dumps(ids))

    print(f"[CIR] Kaydedildi: {len(ids)} urun, item_embs {item_embs.shape}")
    _cache.update({"ids": ids, "clip_embs": clip_embs, "item_embs": item_embs})

    return ids, clip_embs, item_embs


@torch.no_grad()
def find_complementary(
    seed_product_ids: list[int],
    df,
    model,
    *,
    category: str = "",
    k: int = 8,
    outfit_mode: bool = True,
    seed_df=None,
) -> list[dict]:
    ids, clip_embs, item_embs = precompute_catalog(df, model)
    id_to_idx = {pid: i for i, pid in enumerate(ids)}

    id_to_cat: dict[int, str] = {}
    id_to_source = _build_id_to_source(df)
    cat_col = "category" if "category" in df.columns else "category_name"
    for _, row in df.iterrows():
        pid = int(row["id"])
        cat = str(row.get(cat_col, "") or "").strip()
        id_to_cat[pid] = cat

    seed_rows: dict[int, dict] = {}
    if seed_df is not None and len(seed_df):
        seed_cat_col = "category" if "category" in seed_df.columns else "category_name"
        for _, row in seed_df.iterrows():
            seed_rows[int(row["id"])] = {
                "name": str(row.get("name", "") or ""),
                "category": str(row.get(seed_cat_col, "") or "").strip(),
                "image_url": str(row.get("image_url", "") or ""),
                "source": _normalize_source(row.get("source")),
            }

    seed_source: str | None = None
    for pid in seed_product_ids:
        resolved = _resolve_seed_source(int(pid), id_to_source, seed_rows)
        if resolved:
            seed_source = resolved
            break

    if seed_source is None:
        return []

    seed_outfit_items = []
    seed_categories: set[str] = set()
    for pid in seed_product_ids:
        idx = id_to_idx.get(int(pid))
        if idx is not None:
            seed_outfit_items.append(FashionItem(embedding=clip_embs[idx]))
            cat = id_to_cat.get(int(pid), "")
            if cat:
                seed_categories.add(cat)
            continue

        row = seed_rows.get(int(pid))
        if not row:
            continue
        img = _load_image(row["image_url"])
        if img is None:
            continue
        item = FashionItem(image=img, description=row["name"])
        clip_batch = model.precompute_clip_embedding([item])
        seed_outfit_items.append(FashionItem(embedding=clip_batch[0]))
        if row["category"]:
            seed_categories.add(row["category"])

    if not seed_outfit_items:
        return []

    query = [FashionComplementaryQuery(outfit=seed_outfit_items, category=category)]
    q_emb = model.embed_query(query, use_precomputed_embedding=True)
    q_np = q_emb.cpu().numpy()[0]

    dists = np.linalg.norm(item_embs - q_np[np.newaxis], axis=1)
    seed_set = set(int(x) for x in seed_product_ids)

    cp_min_threshold = float(OUTFIT_COMPLEMENT_CFG["cp_min_threshold"])
    cp_soft_threshold = float(OUTFIT_COMPLEMENT_CFG["cp_soft_threshold"])

    results: list[dict] = []
    seen_categories: set[str] = set(seed_categories)

    for idx in np.argsort(dists):
        pid = ids[idx]
        if pid in seed_set:
            continue

        if id_to_source.get(pid, "elegant") != seed_source:
            continue

        item_cat = id_to_cat.get(pid, "")
        if category and item_cat.lower() != category.lower():
            continue
        if outfit_mode:
            if not item_cat or item_cat in seen_categories:
                continue

        outfit_items_for_cp = seed_outfit_items + [FashionItem(embedding=clip_embs[idx])]
        cp_query = [FashionCompatibilityQuery(outfit=outfit_items_for_cp)]
        try:
            cp_score_t = model.predict_score(cp_query, use_precomputed_embedding=True)
            cp_score = float(cp_score_t.sigmoid().item())
        except Exception:
            cp_score = float(1.0 / (1.0 + dists[idx]))

        if cp_score < cp_soft_threshold:
            continue

        if outfit_mode:
            seen_categories.add(item_cat)

        entry = {
            "id": pid,
            "score": round(cp_score, 4),
            "rank": len(results) + 1,
            "category": item_cat,
        }
        if cp_score < cp_min_threshold:
            entry["_soft"] = True

        results.append(entry)
        if len(results) >= k:
            break

    return results


def catalog_status() -> dict:
    if CIR_IDS_PATH.is_file():
        ids = json.loads(CIR_IDS_PATH.read_text())
        return {"computed": len(ids), "ready": True}
    return {"computed": 0, "ready": False}
