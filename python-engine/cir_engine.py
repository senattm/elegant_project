from __future__ import annotations

import importlib
import json
import sys
from pathlib import Path
from typing import Optional

import numpy as np
import torch

ENGINE_DIR = Path(__file__).resolve().parent
REPO_DIR = Path(r"C:\Users\SENA\Desktop\outfit-transformer-main")

CIR_CLIP_EMB_PATH = ENGINE_DIR / "data" / "catalog_cir_clip.npy"
CIR_ITEM_EMB_PATH = ENGINE_DIR / "data" / "catalog_cir_items.npy"
CIR_IDS_PATH = ENGINE_DIR / "data" / "catalog_cir_ids.json"
CIR_FAILED_IDS_PATH = ENGINE_DIR / "data" / "catalog_cir_failed_ids.json"

_cache: dict = {}


def _ensure_repo() -> bool:
    if not REPO_DIR.is_dir():
        return False
    repo_path = str(REPO_DIR)
    if repo_path not in sys.path:
        sys.path.insert(0, repo_path)
    return True


_POLYVORE_LOCAL_DIR = Path(r"C:\Users\SENA\Desktop\elegant\server-nest\public\polyvore-images")
_FAILED_URLS: set[str] = set()


def _load_image(url: str):
    if not url:
        return None
    if url in _FAILED_URLS:
        return None

    try:
        from PIL import Image

        if "polyvore-images" in url:
            fname = url.rsplit("/", 1)[-1]
            local = _POLYVORE_LOCAL_DIR / fname
            if local.is_file():
                return Image.open(local).convert("RGB")
        import io
        import requests

        response = requests.get(url, timeout=8)
        response.raise_for_status()
        return Image.open(io.BytesIO(response.content)).convert("RGB")
    except Exception:
        _FAILED_URLS.add(url)
        return None


def _embed_items(fashion_items: list, model) -> tuple[np.ndarray, np.ndarray]:
    FashionItem = importlib.import_module("src.data.datatypes").FashionItem
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


def precompute_catalog(df, model, *, force: bool = False):
    global _cache

    if not force and _cache.get("ids") and _cache.get("clip_embs") is not None:
        return _cache["ids"], _cache["clip_embs"], _cache["item_embs"]

    if not _ensure_repo():
        raise RuntimeError(f"outfit-transformer-main bulunamadi: {REPO_DIR}")

    FashionItem = importlib.import_module("src.data.datatypes").FashionItem

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
        elif cached_clip is not None:
            try:
                from style_clustering import build_clusters

                build_clusters(cached_ids, cached_clip)
            except Exception:
                pass

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

    if clip_embs is not None:
        try:
            from style_clustering import build_clusters

            build_clusters(ids, clip_embs, force=True)
        except Exception as exc:
            print(f"[Style] Kume hatasi: {exc}")

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
) -> list[dict]:
    if not _ensure_repo():
        return []

    ids, clip_embs, item_embs = precompute_catalog(df, model)
    id_to_idx = {pid: i for i, pid in enumerate(ids)}

    id_to_cat: dict[int, str] = {}
    cat_col = "category" if "category" in df.columns else "category_name"
    for _, row in df.iterrows():
        pid = int(row["id"])
        cat = str(row.get(cat_col, "") or "").strip()
        id_to_cat[pid] = cat

    FashionItem = importlib.import_module("src.data.datatypes").FashionItem
    FashionComplementaryQuery = importlib.import_module("src.data.datatypes").FashionComplementaryQuery

    seed_outfit_items = []
    seed_categories: set[str] = set()
    for pid in seed_product_ids:
        idx = id_to_idx.get(int(pid))
        if idx is None:
            continue
        seed_outfit_items.append(FashionItem(embedding=clip_embs[idx]))
        cat = id_to_cat.get(int(pid), "")
        if cat:
            seed_categories.add(cat)

    if not seed_outfit_items:
        return []

    query = [FashionComplementaryQuery(outfit=seed_outfit_items, category=category)]
    q_emb = model.embed_query(query, use_precomputed_embedding=True)
    q_np = q_emb.cpu().numpy()[0]

    dists = np.linalg.norm(item_embs - q_np[np.newaxis], axis=1)
    seed_set = set(int(x) for x in seed_product_ids)

    if not outfit_mode or category:
        results: list[dict] = []
        seen_categories: set[str] = set()
        for idx in np.argsort(dists):
            pid = ids[idx]
            if pid in seed_set:
                continue
            item_cat = id_to_cat.get(pid, "")
            if category and item_cat.lower() != category.lower():
                continue
            if outfit_mode:
                if item_cat and item_cat in seed_categories:
                    continue
                if item_cat and item_cat in seen_categories:
                    continue
                seen_categories.add(item_cat)
            score = float(1.0 / (1.0 + dists[idx]))
            results.append({
                "id": pid,
                "score": round(score, 4),
                "rank": len(results) + 1,
                "category": item_cat,
            })
            if len(results) >= k:
                break
        return results

    try:
        from style_clustering import get_clusters, nearest_clusters

        id_to_cluster = get_clusters(ids, clip_embs)

        seed_clusters: set[int] = set()
        for pid in seed_product_ids:
            cluster = id_to_cluster.get(int(pid))
            if cluster is not None:
                seed_clusters.add(cluster)

        strict_allowed: set[int] = set(seed_clusters)
        style_filter_active = bool(strict_allowed)
    except Exception:
        id_to_cluster = {}
        strict_allowed = set()
        style_filter_active = False

    def _collect_candidates(allowed_set: set[int], top_n: int) -> dict[str, list[dict]]:
        result: dict[str, list[dict]] = {}
        for idx in np.argsort(dists):
            pid = ids[idx]
            if pid in seed_set:
                continue
            item_cat = id_to_cat.get(pid, "")
            if not item_cat or item_cat in seed_categories:
                continue
            if style_filter_active and allowed_set:
                item_cluster = id_to_cluster.get(pid)
                if item_cluster not in allowed_set:
                    continue
            bucket = result.setdefault(item_cat, [])
            if len(bucket) < top_n:
                score = float(1.0 / (1.0 + dists[idx]))
                bucket.append({"id": pid, "score": round(score, 4), "category": item_cat})
        return result

    top_n_per_cat = 12
    candidates_per_cat = _collect_candidates(strict_allowed, top_n_per_cat)

    min_cats = 3
    if style_filter_active and len(candidates_per_cat) < min_cats:
        try:
            from style_clustering import nearest_clusters as nearest

            expanded: set[int] = set(strict_allowed)
            for seed_cluster in seed_clusters:
                expanded |= nearest(seed_cluster, clip_embs, ids, n=2)
            candidates_per_cat = _collect_candidates(expanded, top_n_per_cat)
            if len(candidates_per_cat) < min_cats:
                candidates_per_cat = _collect_candidates(set(), top_n_per_cat)
        except Exception:
            candidates_per_cat = _collect_candidates(set(), top_n_per_cat)

    cp_min_threshold = 0.52
    FashionCompatibilityQuery = importlib.import_module("src.data.datatypes").FashionCompatibilityQuery
    best_per_cat: dict[str, dict] = {}

    for item_cat, candidates in candidates_per_cat.items():
        best_cp_score = -1.0
        best_candidate = None

        for cand in candidates:
            cand_idx = id_to_idx.get(cand["id"])
            if cand_idx is None:
                continue
            outfit_items_for_cp = seed_outfit_items + [FashionItem(embedding=clip_embs[cand_idx])]
            cp_query = [FashionCompatibilityQuery(outfit=outfit_items_for_cp)]
            try:
                cp_score_t = model.predict_score(cp_query, use_precomputed_embedding=True)
                cp_score = float(cp_score_t.sigmoid().item())
            except Exception:
                cp_score = cand["score"]

            if cp_score > best_cp_score:
                best_cp_score = cp_score
                best_candidate = {**cand, "score": round(cp_score, 4)}

        if best_candidate is not None:
            if best_cp_score >= cp_min_threshold:
                best_per_cat[item_cat] = best_candidate
            elif best_cp_score >= 0.40:
                best_per_cat[item_cat] = {**best_candidate, "_soft": True}

    def _match(cat: str, keywords: list[str]) -> bool:
        normalized = cat.lower()
        return any(keyword in normalized for keyword in keywords)

    dress_cats = [cat for cat in best_per_cat if _match(cat, ["elbise", "dress", "tulum"])]
    top_cats = [cat for cat in best_per_cat if _match(cat, ["üst", "ust", "bluz", "gömlek", "gomlek", "tişört", "tisort", "top", "shirt"])]
    bottom_cats = [cat for cat in best_per_cat if _match(cat, ["alt", "pantolon", "etek", "şort", "short", "jean"])]

    seed_has_top = any(_match(cat, ["üst", "ust", "bluz", "gömlek", "gomlek", "tişört", "tisort", "top", "shirt"]) for cat in seed_categories)
    seed_has_bottom = any(_match(cat, ["alt", "pantolon", "etek", "şort", "short", "jean"]) for cat in seed_categories)
    seed_has_dress = any(_match(cat, ["elbise", "dress", "tulum"]) for cat in seed_categories)

    if seed_has_dress:
        use_dress = True
    elif seed_has_top or seed_has_bottom:
        use_dress = False
    else:
        best_dress_score = max((best_per_cat[cat]["score"] for cat in dress_cats), default=0.0)
        best_top_score = max((best_per_cat[cat]["score"] for cat in top_cats), default=0.0)
        best_bottom_score = max((best_per_cat[cat]["score"] for cat in bottom_cats), default=0.0)
        separates_score = (
            (best_top_score + best_bottom_score) / 2
            if (top_cats and bottom_cats)
            else max(best_top_score, best_bottom_score)
        )
        use_dress = bool(dress_cats) and best_dress_score >= separates_score - 0.005

    if use_dress:
        excluded = set(top_cats) | set(bottom_cats)
    else:
        excluded = set(dress_cats)

    outfit: list[dict] = []
    for cat, item in sorted(best_per_cat.items(), key=lambda pair: -pair[1]["score"]):
        if cat in excluded:
            continue
        outfit.append({**item, "rank": len(outfit) + 1})

    return outfit


def catalog_status() -> dict:
    if CIR_IDS_PATH.is_file():
        ids = json.loads(CIR_IDS_PATH.read_text())
        return {"computed": len(ids), "ready": True}
    return {"computed": 0, "ready": False}
