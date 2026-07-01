
from __future__ import annotations

from pathlib import Path
from typing import Optional

import torch

from outfit_model.outfit_clip_transformer import OutfitCLIPTransformer, OutfitCLIPTransformerConfig
from paths import CHECKPOINT_DIR

_model_cache: dict[str, object] = {}


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


def load_model(checkpoint_path: Optional[Path] = None, model_type: str = "clip"):
    if checkpoint_path is None:
        checkpoint_path = _find_best_checkpoint(model_type)
        if checkpoint_path is None:
            raise FileNotFoundError(f"Checkpoint bulunamadi: {CHECKPOINT_DIR}")

    cache_key = model_type
    if cache_key in _model_cache:
        return _model_cache[cache_key]

    device = "cuda" if torch.cuda.is_available() else "cpu"

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

    print(f"Elegant kombin modeli yuklendi: {checkpoint_path.name} (device={device})")
    _model_cache[cache_key] = model
    return model

if __name__ == "__main__":
    print(f"Checkpoint dizini: {CHECKPOINT_DIR} ({'VAR' if CHECKPOINT_DIR.is_dir() else 'YOK'})")

    best = _find_best_checkpoint("clip")
    print(f"En iyi checkpoint: {best}")

    if best:
        model = load_model(best, "clip")
        total_p = sum(p.numel() for p in model.parameters())
        print(f"Model parametreleri: {total_p:,}")
        print("Test basarili!")
