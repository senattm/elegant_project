"""Outfit complement config — slot eşlemeleri shared/outfit-engine.config.json dosyasından okunur."""
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

CATEGORY_SLOTS: dict[str, str] = dict(_CFG.get("category_slots", {}))
SLOT_CONFLICTS: dict[str, list[str]] = {
    slot: list(conflicts)
    for slot, conflicts in _CFG.get("slot_conflicts", {}).items()
}
# Maps a seed category to the only slots that make sense as recommendations.
# e.g. pijama → only footwear + lower; mayo → only accessory.
SEED_SLOT_ALLOWLIST: dict[str, frozenset[str]] = {
    cat: frozenset(slots)
    for cat, slots in _CFG.get("seed_category_slot_allowlist", {}).items()
}


def category_to_slot(category: str) -> str:
    name = (category or "").strip()
    if not name:
        return ""
    return CATEGORY_SLOTS.get(name, name)


def blocked_outfit_slots(seed_slots: set[str]) -> set[str]:
    blocked: set[str] = set()
    for slot in seed_slots:
        for conflict in SLOT_CONFLICTS.get(slot, []):
            blocked.add(conflict)
    return blocked
