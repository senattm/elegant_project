"""Fine-tuning icin pozitif ciftler ve kontrollu negatifli tripletler uretir."""

from __future__ import annotations

import itertools
import random
from typing import Iterable

import pandas as pd

from evaluation_split import TEST_OUTFIT_INDICES
from outfit_engine import GROUND_TRUTH_OUTFITS

STYLE_TAGS = ["casual", "office", "school", "chic", "party", "formal", "sport"]
RANDOM_SEED = 42

# Ayni gruptan iki parca genelde kombinde olmaz (aksesuar haric)
GROUP_CONFLICT_EXEMPT = {
    "earrings",
    "necklace",
    "bracelet",
    "ring",
    "sunglasses",
    "unknown",
}


def _profile_by_id(df: pd.DataFrame) -> dict[int, str]:
    profiles: dict[int, str] = {}
    for _, row in df.iterrows():
        pid = int(row["id"])
        text = str(row.get("text_profile") or "").strip()
        if text:
            profiles[pid] = text
    return profiles


def _pairs_from_ids(ids: Iterable[int], profiles: dict[int, str]) -> list[tuple[int, int]]:
    valid = [i for i in ids if i in profiles]
    return list(itertools.combinations(valid, 2))


def _holdout_ids(exclude: set[int]) -> set[int]:
    return {
        int(p)
        for i, o in enumerate(GROUND_TRUTH_OUTFITS)
        if i in exclude
        for p in o["parcalar"]
    }


def _build_product_meta(df: pd.DataFrame, holdout_ids: set[int]) -> dict[int, dict]:
    meta: dict[int, dict] = {}
    for _, row in df.iterrows():
        pid = int(row["id"])
        if pid in holdout_ids:
            continue
        tags = row.get("tags_clean") or []
        if isinstance(tags, str):
            tags = [tags]
        tags_set = set(tags)
        seasons = row.get("season_clean") or []
        if isinstance(seasons, str):
            seasons = [seasons]
        meta[pid] = {
            "profile": str(row.get("text_profile") or "").strip(),
            "styles": tags_set & set(STYLE_TAGS),
            "group": str(row.get("product_group") or "unknown"),
            "seasons": set(seasons),
            "tags": tags_set,
        }
    return meta


def _build_co_occurrence(exclude: set[int]) -> set[tuple[int, int]]:
    pairs: set[tuple[int, int]] = set()
    for i, outfit in enumerate(GROUND_TRUTH_OUTFITS):
        if i in exclude:
            continue
        ids = [int(p) for p in outfit["parcalar"]]
        for a in ids:
            for b in ids:
                if a != b:
                    pairs.add((min(a, b), max(a, b)))
    return pairs


def _are_compatible(a: dict, b: dict) -> bool:
    if a["group"] == b["group"] and a["group"] not in GROUP_CONFLICT_EXEMPT:
        return False
    if a["styles"] and b["styles"] and not (a["styles"] & b["styles"]):
        return False
    return True


def _easy_negative_ids(anchor_id: int, meta: dict[int, dict], rng: random.Random) -> list[int]:
    anchor = meta[anchor_id]
    out: list[int] = []
    for pid, m in meta.items():
        if pid == anchor_id:
            continue
        if anchor["styles"] and m["styles"] and not (anchor["styles"] & m["styles"]):
            out.append(pid)
        elif (
            m["group"] == anchor["group"]
            and anchor["group"] not in GROUP_CONFLICT_EXEMPT
        ):
            out.append(pid)
    rng.shuffle(out)
    return out


def _hard_negative_ids(
    anchor_id: int,
    meta: dict[int, dict],
    co_occur: set[tuple[int, int]],
    rng: random.Random,
) -> list[int]:
    anchor = meta[anchor_id]
    out: list[int] = []
    for pid, m in meta.items():
        if pid == anchor_id:
            continue

        key = (min(anchor_id, pid), max(anchor_id, pid))
        if key in co_occur:
            continue

        same_style = bool(anchor["styles"] & m["styles"])
        same_group_conflict = (
            m["group"] == anchor["group"]
            and anchor["group"] not in GROUP_CONFLICT_EXEMPT
        )
        season_conflict = (
            bool(anchor["seasons"])
            and bool(m["seasons"])
            and not (anchor["seasons"] & m["seasons"])
        )

        if same_style and (same_group_conflict or season_conflict):
            out.append(pid)

    rng.shuffle(out)
    return out


def _pick_negative(
    anchor_id: int,
    positive_id: int,
    meta: dict[int, dict],
    co_occur: set[tuple[int, int]],
    rng: random.Random,
    prefer: str,
) -> tuple[int | None, str | None]:
    hard_pool = [
        p
        for p in _hard_negative_ids(anchor_id, meta, co_occur, rng)
        if p != positive_id
    ]
    easy_pool = [
        p for p in _easy_negative_ids(anchor_id, meta, rng) if p != positive_id
    ]

    if prefer == "hard" and hard_pool:
        return hard_pool[0], "hard"
    if prefer == "easy" and easy_pool:
        return easy_pool[0], "easy"
    if hard_pool:
        return hard_pool[0], "hard"
    if easy_pool:
        return easy_pool[0], "easy"
    return None, None


def build_training_pairs(
    df: pd.DataFrame,
    max_style_pairs: int = 400,
    exclude_outfit_indices: set[int] | None = None,
) -> list[tuple[str, str]]:
    """Uyumlu urun metin ciftleri — geriye uyumluluk icin."""
    random.seed(RANDOM_SEED)
    exclude = exclude_outfit_indices if exclude_outfit_indices is not None else TEST_OUTFIT_INDICES
    holdout_ids = _holdout_ids(exclude)
    profiles = _profile_by_id(df)
    pairs: list[tuple[str, str]] = []
    seen: set[tuple[str, str]] = set()

    def add_pair(a: str, b: str) -> None:
        if a == b:
            return
        key = tuple(sorted((a, b)))
        if key in seen:
            return
        seen.add(key)
        pairs.append((a, b))

    for i, outfit in enumerate(GROUND_TRUTH_OUTFITS):
        if i in exclude:
            continue
        outfit_ids = [int(p) for p in outfit["parcalar"]]
        if any(pid in holdout_ids for pid in outfit_ids):
            continue
        for a, b in _pairs_from_ids(outfit_ids, profiles):
            add_pair(profiles[a], profiles[b])

    by_style: dict[str, list[int]] = {tag: [] for tag in STYLE_TAGS}
    for _, row in df.iterrows():
        pid = int(row["id"])
        if pid not in profiles or pid in holdout_ids:
            continue
        tags = row.get("tags_clean") or []
        if isinstance(tags, str):
            tags = [tags]
        for tag in tags:
            if tag in by_style:
                by_style[tag].append(pid)

    style_pairs: list[tuple[str, str]] = []
    for ids in by_style.values():
        if len(ids) < 2:
            continue
        sample_ids = ids if len(ids) <= 30 else random.sample(ids, 30)
        for a, b in itertools.combinations(sample_ids, 2):
            ma, mb = meta_if_exists(df, a), meta_if_exists(df, b)
            if ma and mb and _are_compatible(ma, mb):
                style_pairs.append((profiles[a], profiles[b]))

    random.shuffle(style_pairs)
    for a, b in style_pairs[:max_style_pairs]:
        add_pair(a, b)

    by_season: dict[str, list[int]] = {}
    for _, row in df.iterrows():
        pid = int(row["id"])
        if pid not in profiles or pid in holdout_ids:
            continue
        seasons = row.get("season_clean") or []
        if isinstance(seasons, str):
            seasons = [seasons]
        for season in seasons:
            by_season.setdefault(season, []).append(pid)

    season_pairs: list[tuple[str, str]] = []
    for ids in by_season.values():
        if len(ids) < 2:
            continue
        sample_ids = ids if len(ids) <= 20 else random.sample(ids, 20)
        for a, b in itertools.combinations(sample_ids, 2):
            season_pairs.append((profiles[a], profiles[b]))

    random.shuffle(season_pairs)
    for a, b in season_pairs[:200]:
        add_pair(a, b)

    return pairs


def meta_if_exists(df: pd.DataFrame, pid: int) -> dict | None:
    row = df[df["id"] == pid]
    if row.empty:
        return None
    r = row.iloc[0]
    tags = r.get("tags_clean") or []
    if isinstance(tags, str):
        tags = [tags]
    return {
        "styles": set(tags) & set(STYLE_TAGS),
        "group": str(r.get("product_group") or "unknown"),
        "tags": set(tags),
    }


def build_training_triplets(
    df: pd.DataFrame,
    exclude_outfit_indices: set[int] | None = None,
    max_outfit_triplets: int = 120,
    max_style_triplets: int = 200,
) -> tuple[list[tuple[str, str, str]], dict[str, int]]:
    """
    (anchor, positive, negative) tripletleri.
    Negatifler: easy (farkli stil / grup catismasi) ve hard (benzer tag, kombinde degil).
    """
    rng = random.Random(RANDOM_SEED)
    exclude = exclude_outfit_indices if exclude_outfit_indices is not None else TEST_OUTFIT_INDICES
    holdout_ids = _holdout_ids(exclude)
    meta = _build_product_meta(df, holdout_ids)
    co_occur = _build_co_occurrence(exclude)

    triplets: list[tuple[str, str, str]] = []
    seen: set[tuple[str, str, str]] = set()
    stats = {"outfit": 0, "style": 0, "easy_neg": 0, "hard_neg": 0, "skipped_no_neg": 0}

    def add_triplet(anchor_id: int, pos_id: int, prefer: str, source: str) -> None:
        if anchor_id not in meta or pos_id not in meta:
            return
        neg_id, neg_type = _pick_negative(anchor_id, pos_id, meta, co_occur, rng, prefer)
        if neg_id is None or neg_type is None:
            stats["skipped_no_neg"] += 1
            return
        a, p, n = meta[anchor_id]["profile"], meta[pos_id]["profile"], meta[neg_id]["profile"]
        key = (a, p, n)
        if key in seen:
            return
        seen.add(key)
        triplets.append(key)
        stats[source] += 1
        stats[f"{neg_type}_neg"] += 1

    outfit_pairs: list[tuple[int, int]] = []
    for i, outfit in enumerate(GROUND_TRUTH_OUTFITS):
        if i in exclude:
            continue
        ids = [int(p) for p in outfit["parcalar"] if int(p) in meta]
        if any(int(p) in holdout_ids for p in outfit["parcalar"]):
            continue
        outfit_pairs.extend(_pairs_from_ids(ids, {k: "" for k in meta}))

    rng.shuffle(outfit_pairs)
    for idx, (a, b) in enumerate(outfit_pairs[:max_outfit_triplets]):
        prefer = "hard" if idx % 2 == 0 else "easy"
        add_triplet(a, b, prefer, "outfit")
        add_triplet(b, a, "easy" if prefer == "hard" else "hard", "outfit")

    by_style: dict[str, list[int]] = {tag: [] for tag in STYLE_TAGS}
    for pid, m in meta.items():
        for s in m["styles"]:
            by_style[s].append(pid)

    style_pairs: list[tuple[int, int]] = []
    for ids in by_style.values():
        if len(ids) < 2:
            continue
        sample = ids if len(ids) <= 25 else rng.sample(ids, 25)
        for a, b in itertools.combinations(sample, 2):
            if _are_compatible(meta[a], meta[b]):
                style_pairs.append((a, b))

    rng.shuffle(style_pairs)
    for idx, (a, b) in enumerate(style_pairs[:max_style_triplets]):
        prefer = "hard" if idx % 3 == 0 else "easy"
        add_triplet(a, b, prefer, "style")

    return triplets, stats
