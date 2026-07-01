from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Optional

import numpy as np
import torch

from outfit_config import OUTFIT_COMPLEMENT_CFG, blocked_outfit_slots, category_to_slot
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
CIR_REAL_COOCCUR_PATH = CIR_DATA_DIR / "catalog_real_cooccurrence.json"


def _load_real_cooccurrence() -> dict[int, list[dict]]:
    if not CIR_REAL_COOCCUR_PATH.is_file():
        return {}
    try:
        raw = json.loads(CIR_REAL_COOCCUR_PATH.read_text(encoding="utf-8"))
        return {int(pid): partners for pid, partners in raw.items()}
    except Exception:
        return {}


_REAL_COOCCUR = _load_real_cooccurrence()

_cache: dict = {}
_FAILED_URLS: set[str] = set()
_BACKEND_URL = os.environ.get("BACKEND_URL", "http://127.0.0.1:5000").rstrip("/")


STYLE_TAGS_SPORTY = frozenset({"sport", "casual", "school", "technical-fabric"})
STYLE_TAGS_ELEGANT = frozenset({"chic", "formal", "office", "party", "smart-casual"})
STYLE_MATCH_BONUS = 0.08
STYLE_MISMATCH_PENALTY = 0.08
_MAX_CANDIDATES_PER_SLOT = 4


ESSENTIAL_SLOTS = frozenset({"upper", "lower", "full", "footwear", "bag", "accessory"})


def _style_bucket(tags) -> str:
    if tags is None:
        return "neutral"
    if isinstance(tags, str):
        try:
            tags = json.loads(tags)
        except (json.JSONDecodeError, TypeError):
            tags = [tags]
    if not isinstance(tags, (list, tuple)):
        return "neutral"
    normalized = {str(t).strip().lower() for t in tags if t}
    sporty = len(normalized & STYLE_TAGS_SPORTY)
    elegant = len(normalized & STYLE_TAGS_ELEGANT)
    if sporty > elegant:
        return "sporty"
    if elegant > sporty:
        return "elegant"
    return "neutral"


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
    id_to_style: dict[int, str] = {}
    id_to_source = _build_id_to_source(df)
    cat_col = "category" if "category" in df.columns else "category_name"
    tags_col = "tags" if "tags" in df.columns else None
    for _, row in df.iterrows():
        pid = int(row["id"])
        cat = str(row.get(cat_col, "") or "").strip()
        id_to_cat[pid] = cat
        id_to_style[pid] = _style_bucket(row.get(tags_col)) if tags_col else "neutral"

    seed_rows: dict[int, dict] = {}
    if seed_df is not None and len(seed_df):
        seed_cat_col = "category" if "category" in seed_df.columns else "category_name"
        for _, row in seed_df.iterrows():
            seed_rows[int(row["id"])] = {
                "name": str(row.get("name", "") or ""),
                "category": str(row.get(seed_cat_col, "") or "").strip(),
                "image_url": str(row.get("image_url", "") or ""),
                "source": _normalize_source(row.get("source")),
                "style": _style_bucket(row.get("tags")) if "tags" in seed_df.columns else "neutral",
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
    seed_style: str | None = None
    for pid in seed_product_ids:
        idx = id_to_idx.get(int(pid))
        if idx is not None:
            seed_outfit_items.append(FashionItem(embedding=clip_embs[idx]))
            cat = id_to_cat.get(int(pid), "")
            if cat:
                seed_categories.add(cat)
            if seed_style is None:
                style = id_to_style.get(int(pid), "neutral")
                if style != "neutral":
                    seed_style = style
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
        if seed_style is None and row.get("style", "neutral") != "neutral":
            seed_style = row["style"]

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

    if not outfit_mode:
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

            outfit_items_for_cp = seed_outfit_items + [FashionItem(embedding=clip_embs[idx])]
            cp_query = [FashionCompatibilityQuery(outfit=outfit_items_for_cp)]
            try:
                cp_score_t = model.predict_score(cp_query, use_precomputed_embedding=True)
                cp_score = float(cp_score_t.sigmoid().item())
            except Exception:
                cp_score = float(1.0 / (1.0 + dists[idx]))

            if cp_score < cp_soft_threshold:
                continue

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

    if seed_source != "polyvore":
        return []

    seed_slots: set[str] = set()
    for seed_cat in seed_categories:
        slot = category_to_slot(seed_cat)
        if slot:
            seed_slots.add(slot)
    excluded_slots = seed_slots | blocked_outfit_slots(seed_slots)
    used_slots: set[str] = set(excluded_slots)


    if seed_source == "polyvore" and _REAL_COOCCUR:
        real_by_slot: dict[str, tuple[int, int]] = {}
        for pid in seed_product_ids:
            for partner in _REAL_COOCCUR.get(int(pid), []):
                partner_id = partner["id"]
                if partner_id in seed_set or partner_id not in id_to_idx:
                    continue
                if id_to_source.get(partner_id, "elegant") != seed_source:
                    continue
                partner_slot = category_to_slot(id_to_cat.get(partner_id, ""))
                if not partner_slot or partner_slot in used_slots:
                    continue
                count = partner["count"]
                if partner_slot not in real_by_slot or count > real_by_slot[partner_slot][1]:
                    real_by_slot[partner_slot] = (partner_id, count)

        for slot, (partner_id, _count) in real_by_slot.items():
            if len(results) >= k:
                break
            if slot in used_slots:
                continue
            results.append({
                "id": partner_id,
                "score": 1.0,
                "rank": len(results) + 1,
                "category": id_to_cat.get(partner_id, ""),
                "source": "real_outfit",
            })
            used_slots.add(slot)
            used_slots.update(blocked_outfit_slots({slot}))


    slot_pool: dict[str, list[dict]] = {}
    slot_order: list[str] = []

    if seed_source == "polyvore":
        allowed_model_slots = ESSENTIAL_SLOTS - used_slots
        if not allowed_model_slots:
            return results
    else:
        allowed_model_slots = None

    for idx in np.argsort(dists):
        pid = ids[idx]
        if pid in seed_set:
            continue
        if id_to_source.get(pid, "elegant") != seed_source:
            continue

        item_cat = id_to_cat.get(pid, "")
        item_slot = category_to_slot(item_cat)
        if not item_slot or item_slot in used_slots:
            continue
        if allowed_model_slots is not None and item_slot not in allowed_model_slots:
            continue
        pool = slot_pool.get(item_slot)
        if pool is not None and len(pool) >= _MAX_CANDIDATES_PER_SLOT:
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

        if item_slot not in slot_pool:
            slot_pool[item_slot] = []
            slot_order.append(item_slot)
        slot_pool[item_slot].append({
            "id": pid,
            "score": cp_score,
            "category": item_cat,
            "style": id_to_style.get(pid, "neutral"),
        })

    def _adjusted(candidate: dict) -> float:
        score = candidate["score"]
        if seed_style and candidate["style"] != "neutral":
            if candidate["style"] == seed_style:
                return score + STYLE_MATCH_BONUS
            return score - STYLE_MISMATCH_PENALTY
        return score


    for slot in slot_order:
        if len(results) >= k:
            break
        if slot in used_slots:
            continue
        best = max(slot_pool[slot], key=_adjusted)
        entry = {
            "id": best["id"],
            "score": round(best["score"], 4),
            "rank": len(results) + 1,
            "category": best["category"],
        }
        if best["score"] < cp_min_threshold:
            entry["_soft"] = True
        results.append(entry)
        used_slots.add(slot)
        used_slots.update(blocked_outfit_slots({slot}))

    return results


def catalog_status() -> dict:
    if CIR_IDS_PATH.is_file():
        ids = json.loads(CIR_IDS_PATH.read_text())
        return {"computed": len(ids), "ready": True}
    return {"computed": 0, "ready": False}
