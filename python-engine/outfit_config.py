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

CATEGORY_SLOTS: dict[str, str] = _CFG.get("category_slots", {})
SLOT_CONFLICTS: dict[str, list[str]] = _CFG.get("slot_conflicts", {})


def category_to_slot(category: str) -> str | None:
    return CATEGORY_SLOTS.get((category or "").strip())


def blocked_outfit_slots(occupied_slots: set[str]) -> set[str]:
    blocked: set[str] = set()
    for slot in occupied_slots:
        blocked.update(SLOT_CONFLICTS.get(slot, []))
    return blocked
