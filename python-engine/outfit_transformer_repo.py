"""
outfit-transformer-main repo kodunu dogrudan kullanan wrapper.

Beklenen konum: C:/Users/SENA/Desktop/outfit-transformer-main
Checkpoint:     python-engine/data/checkpoints/<model>/epoch_*.pth

Bu modul mevcut projeye iki sey ekler:
  1. Repo'nun OutfitCLIPTransformer modelini yukler (patrickjohncyh/fashion-clip, 1024-dim)
  2. ELEGANT urunleri icin fashion-clip embedding hesaplar (ayri dosyaya kaydeder)
  3. Kombin uyumluluk skoru verir

Onceden hazir olması gereken dosyalar:
  data/checkpoints/         <- gdown ile indirilen zip acildiktan sonra
  data/product_fashion_clip_embeddings.npy  <- bu modül ilk calıstığında olusturur
"""

from __future__ import annotations

import sys
import importlib
from pathlib import Path
from typing import Optional

import numpy as np
import torch

ENGINE_DIR = Path(__file__).resolve().parent
REPO_DIR = Path(r"C:\Users\SENA\Desktop\outfit-transformer-main")
CHECKPOINT_DIR = ENGINE_DIR / "data" / "checkpoints"
FASHION_CLIP_EMB_PATH = ENGINE_DIR / "data" / "product_fashion_clip_embeddings.npy"
FASHION_CLIP_META_PATH = ENGINE_DIR / "data" / "product_fashion_clip_meta.txt"


# ---------------------------------------------------------------------------
# Repo import helper
# ---------------------------------------------------------------------------

def _ensure_repo_on_path() -> bool:
    """Repo'yu sys.path'e ekler. Basarili ise True."""
    if not REPO_DIR.is_dir():
        return False
    repo_str = str(REPO_DIR)
    if repo_str not in sys.path:
        sys.path.insert(0, repo_str)
    return True


def _find_best_checkpoint(model_type: str = "clip") -> Optional[Path]:
    """
    data/checkpoints/ altinda uyumluluk checkpoint'ini bulur.
    Oncelik sirasi:
      1. compatibillity_clip_best.pth  (indirilen hazir model)
      2. compatibility_clip_best.pth
      3. epoch_*.pth (egitim sirasinda kaydedilen)
    """
    if not CHECKPOINT_DIR.is_dir():
        return None

    # Hazir indirilen ağırlıklar (typo dahil)
    priority_names = [
        "compatibillity_clip_best.pth",
        "compatibility_clip_best.pth",
        f"compatibility_{model_type}_best.pth",
    ]
    for name in priority_names:
        candidate = CHECKPOINT_DIR / name
        if candidate.is_file():
            return candidate

    # Epoch checkpoint'leri (egitimden)
    candidates = []
    for subdir in CHECKPOINT_DIR.iterdir():
        if not subdir.is_dir():
            continue
        if model_type not in subdir.name.lower():
            continue
        for pth in subdir.glob("epoch_*.pth"):
            try:
                epoch_num = int(pth.stem.split("_")[1])
            except (IndexError, ValueError):
                epoch_num = 0
            candidates.append((epoch_num, pth))

    if candidates:
        candidates.sort(key=lambda x: x[0], reverse=True)
        return candidates[0][1]

    return None


# ---------------------------------------------------------------------------
# Model yukleyici
# ---------------------------------------------------------------------------

_model_cache: dict[str, object] = {}


def load_repo_model(checkpoint_path: Optional[Path] = None, model_type: str = "clip"):
    """
    Repo'nun OutfitCLIPTransformer modelini yukler.
    Repo'nun load_model() yerine dogrudan model olusturur (CPU uyumlu).
    """
    if checkpoint_path is None:
        checkpoint_path = _find_best_checkpoint(model_type)
        if checkpoint_path is None:
            raise FileNotFoundError(
                f"Checkpoint bulunamadi: {CHECKPOINT_DIR}"
            )

    cache_key = model_type  # "clip" veya "base" — path değil tip ile cache
    if cache_key in _model_cache:
        return _model_cache[cache_key]

    if not _ensure_repo_on_path():
        raise RuntimeError(f"outfit-transformer-main bulunamadi: {REPO_DIR}")

    device = "cuda" if torch.cuda.is_available() else "cpu"

    try:
        mod_clip = importlib.import_module("src.models.outfit_clip_transformer")
        OutfitCLIPTransformer = mod_clip.OutfitCLIPTransformer
        OutfitCLIPTransformerConfig = mod_clip.OutfitCLIPTransformerConfig
    except ImportError as e:
        raise ImportError(f"Repo import hatasi: {e}") from e

    state = torch.load(str(checkpoint_path), map_location=device, weights_only=False)
    cfg_dict = state.get("config", {})

    # Sadece bilinen alanlari aktar
    valid_fields = set(OutfitCLIPTransformerConfig.__dataclass_fields__.keys())
    filtered = {k: v for k, v in cfg_dict.items() if k in valid_fields}
    cfg = OutfitCLIPTransformerConfig(**filtered)

    model = OutfitCLIPTransformer(cfg)

    # DDP prefix temizle
    sd = state.get("model", state)
    sd = {k.replace("module.", ""): v for k, v in sd.items()}
    model.load_state_dict(sd, strict=True)
    model = model.to(device)
    model.eval()

    print(f"Repo modeli yuklendi: {checkpoint_path.name} (device={device})")
    _model_cache[cache_key] = model
    return model


# ---------------------------------------------------------------------------
# ELEGANT urunleri icin fashion-clip embedding hesaplama
# ---------------------------------------------------------------------------

@torch.no_grad()
def compute_fashion_clip_embeddings(
    df,
    *,
    force: bool = False,
    batch_size: int = 32,
) -> np.ndarray:
    """
    ELEGANT urunleri icin fashion-clip embeddingllerini hesaplar.
    df: load_products() ile yuklenmis DataFrame (id, image_url, description/name sutunlari)
    Returns: (N, 1024) float32 array
    """
    if FASHION_CLIP_EMB_PATH.is_file() and not force:
        existing = np.load(FASHION_CLIP_EMB_PATH)
        meta_line = FASHION_CLIP_META_PATH.read_text().strip() if FASHION_CLIP_META_PATH.is_file() else ""
        if str(len(df)) in meta_line:
            print(f"Fashion-CLIP embeddingler zaten mevcut: {existing.shape}")
            return existing

    if not _ensure_repo_on_path():
        raise RuntimeError(f"outfit-transformer-main bulunamadi: {REPO_DIR}")

    # Model ve FashionItem
    FashionItem = importlib.import_module("src.data.datatypes").FashionItem
    model = load_repo_model(model_type="clip")

    from PIL import Image
    import requests
    import io

    def fetch_image(url: str) -> Optional[Image.Image]:
        try:
            resp = requests.get(url, timeout=10)
            img = Image.open(io.BytesIO(resp.content)).convert("RGB")
            return img
        except Exception:
            return None

    all_embeddings = []
    rows = list(df.iterrows())

    for i in range(0, len(rows), batch_size):
        batch = rows[i:i + batch_size]
        items = []
        for _, row in batch:
            img_url = row.get("image_url") or row.get("primary_image") or ""
            desc = row.get("description") or row.get("name") or row.get("category") or ""
            img = fetch_image(img_url) if img_url else None
            items.append(FashionItem(
                item_id=int(row["id"]),
                image=img,
                description=str(desc),
            ))

        embs = model.precompute_clip_embedding(items)
        all_embeddings.append(embs)
        print(f"  {min(i + batch_size, len(rows))}/{len(rows)} islendi")

    matrix = np.vstack(all_embeddings).astype(np.float32)
    np.save(FASHION_CLIP_EMB_PATH, matrix)
    FASHION_CLIP_META_PATH.write_text(f"{len(df)}|fashion-clip|1024")
    print(f"Fashion-CLIP embeddingler kaydedildi: {matrix.shape}")
    return matrix


# ---------------------------------------------------------------------------
# Uyumluluk skoru
# ---------------------------------------------------------------------------

@torch.no_grad()
def score_outfit_with_repo(
    item_indices: list[int],
    embeddings: np.ndarray,
    *,
    checkpoint_path: Optional[Path] = None,
) -> float:
    """
    item_indices: df satir indisleri (embeddings ile eslesir)
    embeddings: (N, 1024) fashion-clip embedding matrisi
    Returns: 0-1 arasi uyumluluk skoru
    """
    if not _ensure_repo_on_path():
        return 0.0

    try:
        FashionItem = importlib.import_module("src.data.datatypes").FashionItem
        FashionCompatibilityQuery = importlib.import_module("src.data.datatypes").FashionCompatibilityQuery
    except ImportError:
        return 0.0

    model = load_repo_model(checkpoint_path, model_type="clip")

    outfit_items = []
    for idx in item_indices:
        if idx < 0 or idx >= len(embeddings):
            continue
        outfit_items.append(FashionItem(embedding=embeddings[idx]))

    if len(outfit_items) < 2:
        return 0.0

    query = [FashionCompatibilityQuery(outfit=outfit_items)]
    score = model(query, use_precomputed_embedding=True)
    return float(score.cpu().item())


# ---------------------------------------------------------------------------
# CLI: model testi
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print(f"Repo dizini: {REPO_DIR} ({'VAR' if REPO_DIR.is_dir() else 'YOK'})")
    print(f"Checkpoint dizini: {CHECKPOINT_DIR} ({'VAR' if CHECKPOINT_DIR.is_dir() else 'YOK'})")

    best = _find_best_checkpoint("clip")
    print(f"En iyi checkpoint: {best}")

    if best:
        model = load_repo_model(best, "clip")
        total_p = sum(p.numel() for p in model.parameters())
        print(f"Model parametreleri: {total_p:,}")
        print("Test basarili!")
    else:
        print("Checkpoint bulunamadi. Indirme tamamlandiginda yeniden calistirin.")
