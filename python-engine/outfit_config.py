"""Shared outfit engine configuration — single source of truth with Nest."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

_CONFIG_PATH = Path(__file__).resolve().parent.parent / "shared" / "outfit-engine.config.json"


def load_outfit_config() -> dict[str, Any]:
    with open(_CONFIG_PATH, encoding="utf-8") as handle:
        return json.load(handle)


_CFG = load_outfit_config()

GROUND_TRUTH_OUTFITS: list[dict[str, Any]] = _CFG["ground_truth_outfits"]
COLOR_MATCH_MAP: dict[str, list[str]] = _CFG["color_match_map"]
NEUTRAL_COLORS: set[str] = set(_CFG["neutral_colors"])
SCORING: dict[str, float] = _CFG["scoring"]
CURATED_SEED_OUTFITS: dict[str, dict[str, int]] = _CFG.get("curated_seed_outfits", {})
