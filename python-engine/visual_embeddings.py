from __future__ import annotations

import os
import re
import threading
from io import BytesIO
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import numpy as np
import pandas as pd
import requests
from PIL import Image

ENGINE_DIR = Path(__file__).resolve().parent
REPO_ROOT = ENGINE_DIR.parent

VISUAL_MODEL_NAME = os.environ.get(
    "VISUAL_EMBEDDING_MODEL", "sentence-transformers/clip-ViT-B-32"
)
VISUAL_CACHE_PATH = os.environ.get(
    "VISUAL_EMBEDDINGS_CACHE_PATH",
    str(ENGINE_DIR / "data" / "product_visual_embeddings.npy"),
)
VISUAL_META_PATH = os.environ.get(
    "VISUAL_EMBEDDINGS_META_PATH",
    str(ENGINE_DIR / "data" / "visual_embeddings_meta.txt"),
)
VISUAL_BATCH_SIZE = int(os.environ.get("VISUAL_EMBEDDING_BATCH_SIZE", "16"))
VISUAL_REQUEST_TIMEOUT = float(os.environ.get("VISUAL_IMAGE_TIMEOUT", "8"))
PRIMARY_IMAGE_CACHE_TAG = "primary-image-1"
_PRIMARY_IMAGE_STEM = re.compile(r"-1$", re.IGNORECASE)
_PRIMARY_IMAGE_FILE = re.compile(r"-1\.(jpe?g|png|webp)$", re.IGNORECASE)

_visual_model: Any = None
_visual_build_lock = threading.Lock()


def _image_roots() -> list[Path]:
    roots: list[Path] = []
    env_root = os.environ.get("VISUAL_IMAGE_ROOT")
    if env_root:
        roots.append(Path(env_root))
    roots.extend(
        [
            REPO_ROOT / "server-nest" / "public",
            REPO_ROOT / "public",
            ENGINE_DIR / "public",
        ]
    )
    seen: set[str] = set()
    unique: list[Path] = []
    for root in roots:
        key = str(root.resolve()) if root.exists() else str(root)
        if key not in seen:
            seen.add(key)
            unique.append(root)
    return unique


def is_primary_product_image(name_or_path: str) -> bool:
    """Sadece {urunId}-1.* — urun tek basina; -0/-2 model veya detay degil."""
    name = Path(name_or_path).name
    if _PRIMARY_IMAGE_FILE.search(name):
        return True
    return bool(_PRIMARY_IMAGE_STEM.search(Path(name).stem))


def resolve_image_source(image_url: str | None, product_id: int) -> str | Path | None:
    """Yerel {id}-1.* veya -1 iceren URL; diger varyantlar kullanilmaz."""
    for root in _image_roots():
        for ext in ("jpg", "jpeg", "png", "webp"):
            candidate = root / "images" / "products" / f"{product_id}-1.{ext}"
            if candidate.is_file():
                return candidate

    if image_url and str(image_url).strip():
        url = str(image_url).strip()
        parsed = urlparse(url)
        if parsed.scheme in ("http", "https"):
            if is_primary_product_image(url):
                return url
            return None

        rel = url.lstrip("/").replace("\\", "/")
        basename = Path(rel).name
        if not is_primary_product_image(basename):
            return None
        for root in _image_roots():
            candidate = root / rel
            if candidate.is_file():
                return candidate
            candidate = root / "images" / "products" / basename
            if candidate.is_file():
                return candidate

    return None


def _load_pil(source: str | Path) -> Image.Image | None:
    try:
        if isinstance(source, Path):
            with Image.open(source) as img:
                return img.convert("RGB")
        resp = requests.get(str(source), timeout=VISUAL_REQUEST_TIMEOUT)
        resp.raise_for_status()
        with Image.open(BytesIO(resp.content)) as img:
            return img.convert("RGB")
    except Exception as exc:
        print(f"Visual embed image load failed ({source}): {exc}")
        return None


def _load_visual_model():
    global _visual_model
    if _visual_model is None:
        from sentence_transformers import SentenceTransformer

        print(f"Loading visual embedding model: {VISUAL_MODEL_NAME}")
        _visual_model = SentenceTransformer(VISUAL_MODEL_NAME)
    return _visual_model


def _read_cache(product_count: int, db_max_updated) -> np.ndarray | None:
    if not os.path.isfile(VISUAL_CACHE_PATH) or not os.path.isfile(VISUAL_META_PATH):
        return None
    try:
        with open(VISUAL_META_PATH, encoding="utf-8") as f:
            meta = f.read().strip().split("|")
        cached_count = int(meta[0])
        cached_updated = meta[1] if len(meta) > 1 and meta[1] != "none" else None
        cached_model = meta[2] if len(meta) > 2 else ""
        cached_tag = meta[3] if len(meta) > 3 else ""
        current_updated = (
            db_max_updated.isoformat() if db_max_updated is not None else "none"
        )
        if (
            cached_count != product_count
            or cached_updated != current_updated
            or cached_model != VISUAL_MODEL_NAME
            or cached_tag != PRIMARY_IMAGE_CACHE_TAG
        ):
            return None
        arr = np.load(VISUAL_CACHE_PATH)
        if arr.shape[0] != product_count:
            return None
        print(f"Loaded cached visual embeddings ({arr.shape})")
        return arr
    except Exception as exc:
        print(f"Visual embedding cache read failed: {exc}")
        return None


def _write_cache(matrix: np.ndarray, product_count: int, db_max_updated) -> None:
    os.makedirs(os.path.dirname(VISUAL_CACHE_PATH), exist_ok=True)
    np.save(VISUAL_CACHE_PATH, matrix)
    updated = db_max_updated.isoformat() if db_max_updated is not None else "none"
    with open(VISUAL_META_PATH, "w", encoding="utf-8") as f:
        f.write(f"{product_count}|{updated}|{VISUAL_MODEL_NAME}|{PRIMARY_IMAGE_CACHE_TAG}")


def build_visual_embeddings(
    prepared_df: pd.DataFrame,
    db_max_updated,
) -> tuple[np.ndarray, dict[str, int]]:
    with _visual_build_lock:
        return _build_visual_embeddings_locked(prepared_df, db_max_updated)


def _build_visual_embeddings_locked(
    prepared_df: pd.DataFrame,
    db_max_updated,
) -> tuple[np.ndarray, dict[str, int]]:
    cached = _read_cache(len(prepared_df), db_max_updated)
    if cached is not None:
        return cached, {"from_cache": 1, "encoded_images": 0, "missing_images": 0}

    model = _load_visual_model()
    images: list[Image.Image] = []
    row_indices: list[int] = []
    missing = 0

    for idx, row in prepared_df.iterrows():
        pid = int(row["id"])
        source = resolve_image_source(row.get("image_url"), pid)
        if source is None:
            missing += 1
            continue
        pil = _load_pil(source)
        if pil is None:
            missing += 1
            continue
        images.append(pil)
        row_indices.append(int(idx))

    print(
        f"Encoding {len(images)} product images "
        f"({missing} missing, model={VISUAL_MODEL_NAME})..."
    )

    if images:
        encoded = model.encode(
            images,
            batch_size=VISUAL_BATCH_SIZE,
            show_progress_bar=False,
            convert_to_numpy=True,
        )
    else:
        dim = model.get_sentence_embedding_dimension()
        encoded = np.zeros((0, dim), dtype=np.float32)

    dim = int(encoded.shape[1]) if encoded.size else model.get_sentence_embedding_dimension()
    matrix = np.zeros((len(prepared_df), dim), dtype=np.float32)

    if len(row_indices) and len(encoded):
        for i, df_idx in enumerate(row_indices):
            matrix[df_idx] = encoded[i]

    if missing:
        print(
            "Warning: missing CLIP embeddings for some products — "
            "those rows stay zero vectors."
        )

    _write_cache(matrix, len(prepared_df), db_max_updated)
    stats = {
        "from_cache": 0,
        "encoded_images": len(images),
        "missing_images": missing,
    }
    return matrix, stats
