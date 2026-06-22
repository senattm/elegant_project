"""
outfit-transformer-main repo kodunu dogrudan kullanan wrapper.

Beklenen konum: C:/Users/SENA/Desktop/outfit-transformer-main
Checkpoint:     python-engine/data/checkpoints/<model>/epoch_*.pth
"""

from __future__ import annotations

import sys
import importlib
from pathlib import Path
from typing import Optional

import torch

ENGINE_DIR = Path(__file__).resolve().parent
REPO_DIR = Path(r"C:\Users\SENA\Desktop\outfit-transformer-main")
CHECKPOINT_DIR = ENGINE_DIR / "data" / "checkpoints"

_model_cache: dict[str, object] = {}


def _ensure_repo_on_path() -> bool:
    if not REPO_DIR.is_dir():
        return False
    repo_str = str(REPO_DIR)
    if repo_str not in sys.path:
        sys.path.insert(0, repo_str)
    return True


def _find_best_checkpoint(model_type: str = "clip") -> Optional[Path]:
    if not CHECKPOINT_DIR.is_dir():
        return None

    priority_names = [
        "compatibillity_clip_best.pth",
        "compatibility_clip_best.pth",
        f"compatibility_{model_type}_best.pth",
    ]
    for name in priority_names:
        candidate = CHECKPOINT_DIR / name
        if candidate.is_file():
            return candidate

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


def load_repo_model(checkpoint_path: Optional[Path] = None, model_type: str = "clip"):
    if checkpoint_path is None:
        checkpoint_path = _find_best_checkpoint(model_type)
        if checkpoint_path is None:
            raise FileNotFoundError(f"Checkpoint bulunamadi: {CHECKPOINT_DIR}")

    cache_key = model_type
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

    valid_fields = set(OutfitCLIPTransformerConfig.__dataclass_fields__.keys())
    filtered = {k: v for k, v in cfg_dict.items() if k in valid_fields}
    cfg = OutfitCLIPTransformerConfig(**filtered)

    model = OutfitCLIPTransformer(cfg)

    sd = state.get("model", state)
    sd = {k.replace("module.", ""): v for k, v in sd.items()}
    model.load_state_dict(sd, strict=True)
    model = model.to(device)
    model.eval()

    print(f"Repo modeli yuklendi: {checkpoint_path.name} (device={device})")
    _model_cache[cache_key] = model
    return model


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
