from __future__ import annotations

import colorsys
import json
import os
from pathlib import Path
from typing import Optional

import numpy as np
import torch

from outfit_config import OUTFIT_COMPLEMENT_CFG, SEED_SLOT_ALLOWLIST, blocked_outfit_slots, category_to_slot
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
CIR_META_PATH = CIR_DATA_DIR / "catalog_cir_meta.json"
CIR_COLORS_PATH = CIR_DATA_DIR / "catalog_cir_colors.json"
CIR_EMBEDDING_PURPOSE = "complementary"

# Slots that form the "accent" layer (jacket, shoes, bag) — should share one color family.
# Slots that form the "base" layer (top, bottom, dress) — should contrast with accent.
ACCENT_SLOTS = frozenset({"outer", "footwear", "bag", "accessory"})
BASE_SLOTS = frozenset({"upper", "lower", "full"})
_MAX_CANDIDATES_PER_SLOT = 4

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


def _dominant_color_bucket(img) -> str:
    """
    Returns the dominant color family of a clothing item.
    Buckets: 'warm' (red/orange/yellow/brown), 'cool' (blue/green/purple),
             'neutral' (beige/light gray), 'dark' (black/very dark).
    Product photos typically have white backgrounds — those pixels are excluded.
    """
    small = img.resize((64, 64)).convert("RGB")
    arr = np.array(small, dtype=np.float32).reshape(-1, 3)
    brightness = arr.mean(axis=1)
    # Exclude near-white background pixels common in product photos
    clothing = arr[brightness < 215]
    if clothing.shape[0] < 80:
        clothing = arr

    hues: list[float] = []
    for r, g, b in clothing:
        h, s, v = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
        if s > 0.15 and 0.12 < v < 0.95:
            hues.append(h * 360.0)

    if len(hues) < 30:
        return "dark" if float(clothing.mean()) < 85 else "neutral"

    avg_hue = float(np.mean(hues))
    # warm: reds, oranges, yellows, pinks (0–60° and 315–360°)
    # cool: greens, blues, purples (90–315°)
    if avg_hue < 60 or avg_hue >= 315:
        return "warm"
    elif avg_hue < 75:
        return "warm"   # yellow-green → still warm-ish
    else:
        return "cool"


def _fill_missing_colors(ids: list[int], db_rows: dict[int, dict]) -> None:
    """Mevcut cache'deki ürünler için renk hesabı hiç yapılmamışsa tek seferlik çalışır."""
    existing: dict[str, str] = {}
    if CIR_COLORS_PATH.is_file():
        try:
            existing = json.loads(CIR_COLORS_PATH.read_text())
        except Exception:
            pass
    missing = [pid for pid in ids if str(pid) not in existing and pid in db_rows]
    if not missing:
        return
    print(f"[CIR] {len(missing)} urun icin renk hesaplaniyor (tek seferlik)…")
    for pid in missing:
        img = _load_image(db_rows[pid]["url"])
        if img is not None:
            existing[str(pid)] = _dominant_color_bucket(img)
    CIR_COLORS_PATH.write_text(json.dumps(existing))
    print(f"[CIR] Renk cache hazir ({len(existing)} urun).")


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

    if not force and CIR_META_PATH.is_file():
        try:
            meta = json.loads(CIR_META_PATH.read_text())
            if meta.get("embedding_purpose") != CIR_EMBEDDING_PURPOSE:
                print("[CIR] Eski uyumluluk embedding cache'i temizleniyor…")
                force = True
        except Exception:
            force = True
    elif CIR_IDS_PATH.is_file() and not force:
        print("[CIR] Embedding amaci belirsiz, katalog yeniden hesaplanacak…")
        force = True

    if force:
        for path in (CIR_IDS_PATH, CIR_CLIP_EMB_PATH, CIR_ITEM_EMB_PATH, CIR_FAILED_IDS_PATH, CIR_COLORS_PATH):
            if path.is_file():
                path.unlink()
        _cache.clear()

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
        if CIR_COLORS_PATH.is_file():
            try:
                colors = json.loads(CIR_COLORS_PATH.read_text())
                for pid in removed:
                    colors.pop(str(pid), None)
                CIR_COLORS_PATH.write_text(json.dumps(colors))
            except Exception:
                pass

    current_id_set = set(cached_ids)
    new_ids = [pid for pid in db_ids if pid not in current_id_set and pid not in failed_ids]

    if new_ids:
        print(f"[CIR] {len(new_ids)} yeni urun icin embedding hesaplaniyor…")
        new_fashion_items: list = []
        valid_new_ids: list[int] = []
        new_colors: dict[str, str] = {}
        for pid in new_ids:
            img = _load_image(db_rows[pid]["url"])
            if img is None:
                continue
            new_fashion_items.append(FashionItem(image=img, description=db_rows[pid]["desc"]))
            valid_new_ids.append(pid)
            new_colors[str(pid)] = _dominant_color_bucket(img)
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
            # Persist color cache incrementally
            existing_colors: dict[str, str] = {}
            if CIR_COLORS_PATH.is_file():
                try:
                    existing_colors = json.loads(CIR_COLORS_PATH.read_text())
                except Exception:
                    pass
            existing_colors.update(new_colors)
            CIR_COLORS_PATH.write_text(json.dumps(existing_colors))
    elif not removed:
        _fill_missing_colors(cached_ids, db_rows)
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
    CIR_META_PATH.write_text(json.dumps({"embedding_purpose": CIR_EMBEDDING_PURPOSE}))

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
    compat_model=None,
) -> list[dict]:
    ids, clip_embs, item_embs = precompute_catalog(df, model)
    cp_model = compat_model or model
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

    # Slots already occupied by seed items
    excluded_slots: set[str] = set()
    for seed_cat in seed_categories:
        slot = category_to_slot(seed_cat)
        if slot:
            excluded_slots.add(slot)

    # ── Non-outfit mode: original single-pass behavior ────────────────────────
    if not outfit_mode:
        results: list[dict] = []
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
                cp_score_t = cp_model.predict_score(cp_query, use_precomputed_embedding=True)
                cp_score = float(cp_score_t.sigmoid().item())
            except Exception:
                cp_score = float(1.0 / (1.0 + dists[idx]))

            if cp_score < cp_soft_threshold:
                continue

            entry: dict = {
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

    # ── Outfit mode: two-phase color-diversity selection ──────────────────────

    # Load precomputed color buckets (populated during precompute_catalog)
    id_to_color: dict[int, str] = {}
    if CIR_COLORS_PATH.is_file():
        try:
            raw = json.loads(CIR_COLORS_PATH.read_text())
            id_to_color = {int(key): val for key, val in raw.items()}
        except Exception:
            pass

    # Slots blocked by the seed's category conflicts (e.g. seed=dress blocks upper+lower)
    blocked_by_seed = blocked_outfit_slots(excluded_slots)
    all_seed_excluded = excluded_slots | blocked_by_seed

    # Restrict recommendation slots when seed belongs to a contextual category
    # (e.g. pijama → only footwear + lower; mayo → only accessory)
    allowed_slots: frozenset[str] | None = None
    for seed_cat in seed_categories:
        if seed_cat in SEED_SLOT_ALLOWLIST:
            restriction = SEED_SLOT_ALLOWLIST[seed_cat]
            allowed_slots = restriction if allowed_slots is None else allowed_slots & restriction

    # Phase 1: collect up to _MAX_CANDIDATES_PER_SLOT candidates per slot
    # (slot conflicts between recommendations are handled in Phase 2)
    per_slot_pool: dict[str, list[dict]] = {}

    for idx in np.argsort(dists):
        pid = ids[idx]
        if pid in seed_set:
            continue
        if id_to_source.get(pid, "elegant") != seed_source:
            continue

        item_cat = id_to_cat.get(pid, "")
        item_slot = category_to_slot(item_cat)
        if not item_slot or item_slot in all_seed_excluded:
            continue
        if allowed_slots is not None and item_slot not in allowed_slots:
            continue
        if item_slot in per_slot_pool and len(per_slot_pool[item_slot]) >= _MAX_CANDIDATES_PER_SLOT:
            continue

        outfit_items_for_cp = seed_outfit_items + [FashionItem(embedding=clip_embs[idx])]
        cp_query = [FashionCompatibilityQuery(outfit=outfit_items_for_cp)]
        try:
            cp_score_t = cp_model.predict_score(cp_query, use_precomputed_embedding=True)
            cp_score = float(cp_score_t.sigmoid().item())
        except Exception:
            cp_score = float(1.0 / (1.0 + dists[idx]))

        if cp_score < cp_soft_threshold:
            continue

        if item_slot not in per_slot_pool:
            per_slot_pool[item_slot] = []
        per_slot_pool[item_slot].append({
            "id": pid,
            "score": cp_score,
            "category": item_cat,
            "slot": item_slot,
            "color": id_to_color.get(pid, "unknown"),
        })

    if not per_slot_pool:
        return []

    # Phase 2: color-diversity-aware selection
    # Accent slots (outer/footwear/bag/accessory) are selected first to establish
    # the "accent color". Base slots (upper/lower/full) then prefer a contrasting color.
    def _pick(slot: str, prefer_color: str | None, avoid_color: str | None) -> dict | None:
        pool = per_slot_pool.get(slot, [])
        if not pool:
            return None

        def _adjusted(c: dict) -> float:
            s = c["score"]
            col = c["color"]
            if col in ("unknown", "neutral", "dark"):
                return s  # achromatic items work with any color theme
            if prefer_color and col == prefer_color:
                return s + 0.12
            if avoid_color and col == avoid_color:
                return s - 0.12
            return s

        return max(pool, key=_adjusted)

    results = []
    used_slots: set[str] = set(excluded_slots)

    # Initialise accent_color from seed if the seed is itself an accent item
    accent_color: str | None = None
    for pid in seed_product_ids:
        cat = id_to_cat.get(int(pid), "") or seed_rows.get(int(pid), {}).get("category", "")
        if category_to_slot(cat) in ACCENT_SLOTS:
            col = id_to_color.get(int(pid), "unknown")
            if col in ("warm", "cool"):
                accent_color = col
            break

    # Select accent slots first → establishes the shared accent color
    for slot in ["outer", "footwear", "bag", "accessory"]:
        if slot in used_slots or slot in blocked_outfit_slots(used_slots):
            continue
        item = _pick(slot, prefer_color=accent_color, avoid_color=None)
        if not item:
            continue
        col = item["color"]
        if accent_color is None and col in ("warm", "cool"):
            accent_color = col
        used_slots.add(slot)
        entry = {
            "id": item["id"],
            "score": round(item["score"], 4),
            "rank": len(results) + 1,
            "category": item["category"],
        }
        if item["score"] < cp_min_threshold:
            entry["_soft"] = True
        results.append(entry)

    # Select base slots next → prefer contrasting with accent color
    for slot in ["upper", "lower", "full"]:
        if slot in used_slots or slot in blocked_outfit_slots(used_slots):
            continue
        item = _pick(slot, prefer_color=None, avoid_color=accent_color)
        if not item:
            continue
        used_slots.add(slot)
        entry = {
            "id": item["id"],
            "score": round(item["score"], 4),
            "rank": len(results) + 1,
            "category": item["category"],
        }
        if item["score"] < cp_min_threshold:
            entry["_soft"] = True
        results.append(entry)

    return results[:k]


def catalog_status() -> dict:
    if CIR_IDS_PATH.is_file():
        ids = json.loads(CIR_IDS_PATH.read_text())
        return {"computed": len(ids), "ready": True}
    return {"computed": 0, "ready": False}
