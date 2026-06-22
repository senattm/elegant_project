from __future__ import annotations

import json
from pathlib import Path
from typing import Any

_SHARED_DIR = Path(__file__).resolve().parent.parent / "shared"
_CONFIG_PATH = _SHARED_DIR / "outfit-engine.config.json"


def load_outfit_config() -> dict[str, Any]:
    with open(_CONFIG_PATH, encoding="utf-8") as handle:
        return json.load(handle)


_CFG = load_outfit_config()
_COMP = _CFG.get("outfit_complement", {})

OUTFIT_COMPLEMENT_CFG: dict[str, float] = {
    "cp_min_threshold": float(_COMP.get("cp_min_threshold", 0.52)),
    "cp_soft_threshold": float(_COMP.get("cp_soft_threshold", 0.40)),
}
