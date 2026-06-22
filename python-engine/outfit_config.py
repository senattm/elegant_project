from __future__ import annotations

import json
from pathlib import Path
from typing import Any

_SHARED_DIR = Path(__file__).resolve().parent.parent / "shared"
_CONFIG_PATH = _SHARED_DIR / "outfit-engine.config.json"


def load_outfit_config() -> dict[str, Any]:
    with open(_CONFIG_PATH, encoding="utf-8") as handle:
        return json.load(handle)


def load_reference_outfits() -> list[dict[str, Any]]:
    cfg = load_outfit_config()
    engine = cfg.get("recommendation_engine", {})
    ref_name = engine.get("reference_outfits_file", "reference_outfits.json")
    ref_path = _SHARED_DIR / ref_name
    with open(ref_path, encoding="utf-8") as handle:
        data = json.load(handle)
    outfits = data.get("outfits", data)
    if not isinstance(outfits, list):
        raise ValueError(f"reference_outfits invalid format: {ref_path}")
    return outfits


_CFG = load_outfit_config()

REFERENCE_OUTFITS: list[dict[str, Any]] = load_reference_outfits()
COLOR_MATCH_MAP: dict[str, list[str]] = _CFG["color_match_map"]
NEUTRAL_COLORS: set[str] = set(_CFG["neutral_colors"])
SCORING: dict[str, float] = _CFG["scoring"]

_ENGINE = _CFG.get("recommendation_engine", {})
RECOMMENDATION_ENGINE_MODE: str = str(_ENGINE.get("mode", "rule_based"))
USE_REFERENCE_IN_INFERENCE: bool = bool(
    _ENGINE.get("use_reference_outfits_in_inference", False)
)
