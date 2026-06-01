"""Colab outfit recommender: tag-based grouping, color rules, co-occurrence memory."""

from __future__ import annotations

import ast
import json
from typing import Any

import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

from outfit_config import (
    COLOR_MATCH_MAP,
    CURATED_SEED_OUTFITS,
    GROUND_TRUTH_OUTFITS,
    NEUTRAL_COLORS,
    SCORING,
)


def safe_json_load(val: Any) -> list:
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return []
    if isinstance(val, (list, tuple, set)):
        return list(val)
    if isinstance(val, str):
        val_clean = val.strip()
        if not val_clean:
            return []
        try:
            return json.loads(val_clean)
        except json.JSONDecodeError:
            try:
                return ast.literal_eval(val_clean)
            except (ValueError, SyntaxError):
                cleaned = (
                    val_clean.replace("[", "")
                    .replace("]", "")
                    .replace('"', "")
                    .replace("'", "")
                )
                return [x.strip() for x in cleaned.split(",") if x.strip()]
    return []


def flatten_and_lower(elements: Any) -> list[str]:
    cleaned: list[str] = []
    if not isinstance(elements, (list, set, tuple)):
        if elements is None or (isinstance(elements, float) and pd.isna(elements)):
            return []
        elements = [elements]

    for item in elements:
        if isinstance(item, list):
            cleaned.extend(str(i).lower().strip() for i in item if not pd.isna(i))
        elif not pd.isna(item):
            cleaned.append(str(item).lower().strip())
    return cleaned


def custom_detect_product_group(tags_list: list[str]) -> str:
    if not tags_list:
        return "unknown"

    tags_set = set(tags_list)

    is_upper = tags_set.intersection(
        {
            "topwear",
            "t-shirt",
            "blouse",
            "shirt",
            "knitwear",
            "gömlek",
            "tişört",
            "bluz",
            "kazak",
            "sweater",
            "cardigan",
        }
    )
    is_skirt = tags_set.intersection({"skirt", "etek"})
    is_pants = tags_set.intersection(
        {
            "pants",
            "pantolon",
            "denim",
            "jeans",
            "jean",
            "lower",
            "trouser",
            "shorts",
            "şort",
            "bermuda",
        }
    )
    is_dress = tags_set.intersection({"dress", "elbise"})
    is_outerwear = tags_set.intersection(
        {
            "outerwear",
            "jacket",
            "coat",
            "trench coat",
            "ceket",
            "mont",
            "kaban",
            "trençkot",
            "palto",
            "blazer",
        }
    )
    is_shoes = tags_set.intersection(
        {
            "shoes",
            "ayakkabı",
            "boots",
            "sneakers",
            "sandalet",
            "bot",
            "çizme",
            "ayakkabi",
            "heels",
            "sandal",
        }
    )
    is_bag = tags_set.intersection({"bag", "bags", "çanta", "canta"})
    is_accessory = tags_set.intersection(
        {
            "accessory",
            "accessories",
            "takı",
            "kolye",
            "küpe",
            "bilezik",
            "yüzük",
            "aksesuar",
            "bileklik",
            "gözlük",
            "kupe",
            "earrings",
            "necklace",
            "bracelets",
            "bracelet",
            "sunglasses",
            "ring",
        }
    )

    if is_bag:
        return "bags"
    if is_shoes:
        if tags_set.intersection({"boots", "bot", "çizme"}):
            return "boots"
        if "sneakers" in tags_set:
            return "sneakers"
        if tags_set.intersection({"sandal", "sandalet"}):
            return "sandal"
        if tags_set.intersection({"heels", "topuklu"}):
            return "heels"
        return "sneakers"
    if is_accessory:
        if tags_set.intersection({"earrings", "küpe"}):
            return "earrings"
        if tags_set.intersection({"necklace", "kolye"}):
            return "necklace"
        if tags_set.intersection({"bracelet", "bracelets", "bileklik", "bilezik"}):
            return "bracelet"
        if tags_set.intersection({"sunglasses", "gözlük"}):
            return "sunglasses"
        if tags_set.intersection({"ring", "yüzük"}):
            return "ring"
        return "earrings"
    if is_outerwear:
        if tags_set.intersection({"coat", "kaban", "mont", "palto"}):
            return "coats"
        if tags_set.intersection({"trench coat", "trençkot"}):
            return "trench_coat"
        if "blazer" in tags_set:
            return "blazer"
        if tags_set.intersection({"jacket", "ceket"}):
            return "jacket"
        return "jacket"
    if is_dress:
        return "dress"
    if is_skirt:
        if "mini" in tags_set:
            return "mini skirt"
        return "long skirt"
    if is_upper:
        if tags_set.intersection({"t-shirt", "tişört"}):
            return "t-shirt"
        if tags_set.intersection({"blouse", "top"}):
            return "blouse"
        if tags_set.intersection({"sweater", "kazak"}):
            return "sweater"
        if tags_set.intersection({"cardigan", "hırka"}):
            return "cardigan"
        if tags_set.intersection({"shirt", "gömlek"}):
            return "shirt"
        return "blouse"
    if is_pants:
        if tags_set.intersection({"shorts", "bermuda", "şort"}):
            return "shorts"
        if tags_set.intersection({"denim", "jean", "jeans"}):
            return "denim"
        return "pants"
    return "unknown"


def _product_group_from_name(name: Any) -> str:
    """Fallback when tags do not classify the item."""
    name_low = str(name or "").lower()
    if "elbise" in name_low or "dress" in name_low:
        return "dress"
    if "etek" in name_low or "skirt" in name_low:
        return "mini skirt" if "mini" in name_low else "long skirt"
    if "jean" in name_low or "denim" in name_low:
        return "denim"
    if "pantolon" in name_low or "pants" in name_low or "trouser" in name_low:
        return "pants"
    if "gömlek" in name_low or "shirt" in name_low:
        return "shirt"
    if "çizme" in name_low or "bot" in name_low or "boot" in name_low:
        return "boots"
    if "sneaker" in name_low:
        return "sneakers"
    if "trenç" in name_low or "trench" in name_low:
        return "trench_coat"
    if "mont" in name_low or "kaban" in name_low or "ceket" in name_low or "jacket" in name_low:
        return "jacket"
    if "kazak" in name_low or "sweater" in name_low:
        return "sweater"
    if "hırka" in name_low or "cardigan" in name_low:
        return "cardigan"
    if "çanta" in name_low or "bag" in name_low:
        return "bags"
    if "ayakkab" in name_low or "shoe" in name_low or "heel" in name_low:
        return "heels"
    if "bluz" in name_low or "blouse" in name_low or "top" in name_low:
        return "blouse"
    return "unknown"


def resolve_product_group(tags_clean: list[str], name: Any) -> str:
    group = custom_detect_product_group(tags_clean)
    if group != "unknown":
        return group
    return _product_group_from_name(name)


def is_color_compatible(seed_colors: list[str], candidate_colors: list[str]) -> bool:
    if not seed_colors or not candidate_colors:
        return True
    for sc in seed_colors:
        if sc in COLOR_MATCH_MAP:
            for cc in candidate_colors:
                if cc in COLOR_MATCH_MAP[sc] or sc == cc:
                    return True
            return False
    return True


def shares_exact_color(a: list[str], b: list[str]) -> bool:
    return bool(set(a) & set(b))


def colors_harmonize(a: list[str], b: list[str]) -> bool:
    if not a or not b:
        return True
    if shares_exact_color(a, b):
        return True
    return get_color_score(a, b) > 0


def is_neutral_color(colors: list[str]) -> bool:
    return any(c in NEUTRAL_COLORS for c in colors)


def get_color_score(seed_colors: list[str], candidate_colors: list[str]) -> float:
    if not seed_colors or not candidate_colors:
        return 0.1
    score = 0.0
    for sc in seed_colors:
        for cc in candidate_colors:
            if sc == cc:
                score += SCORING["exact_color_bonus"]
            elif sc in COLOR_MATCH_MAP and cc in COLOR_MATCH_MAP[sc]:
                score += SCORING["compatible_color_bonus"]
            else:
                score += SCORING["incompatible_color_penalty"]
    return score


def monochromatic_penalty(
    role: str,
    candidate_colors: list[str],
    outfit_colors: list[list[str]],
) -> float:
    if role not in {"upper", "lower", "outerwear"} or not outfit_colors:
        return 0.0
    penalty = 0.0
    cand_set = set(candidate_colors)
    for oc in outfit_colors:
        overlap = cand_set & set(oc)
        if overlap:
            penalty -= SCORING["monochrome_penalty_per_overlap"] * len(overlap)
    return penalty


def get_role_color_score(
    role: str,
    seed_colors: list[str],
    candidate_colors: list[str],
    outfit_colors: list[list[str]],
    pair_colors: list[str] | None = None,
) -> float:
    neutral_roles = {"shoes", "bag"}
    anchor_roles = {"upper", "lower"}

    score = 0.0
    if pair_colors:
        score += (
            SCORING["pair_harmonize_bonus"]
            if colors_harmonize(candidate_colors, pair_colors)
            else SCORING["pair_harmonize_penalty"]
        )

    if role in neutral_roles:
        if is_neutral_color(candidate_colors):
            score += (
                SCORING["neutral_bonus_with_pair"]
                if pair_colors
                else SCORING["neutral_bonus_without_pair"]
            )
        base = get_color_score(seed_colors, candidate_colors)
        if shares_exact_color(seed_colors, candidate_colors):
            return score + base * SCORING["seed_exact_neutral_multiplier"]
        return score + base

    base = get_color_score(seed_colors, candidate_colors)
    if role in anchor_roles and shares_exact_color(seed_colors, candidate_colors):
        return score + base * SCORING["seed_exact_anchor_multiplier"]
    if is_neutral_color(candidate_colors):
        return score + base + SCORING["neutral_layer_bonus"]
    if shares_exact_color(seed_colors, candidate_colors):
        return score + base * SCORING["seed_exact_default_multiplier"]
    return score + base


def filter_candidates_by_role(
    role: str,
    seed_colors: list[str],
    candidates: pd.DataFrame,
    pair_colors: list[str] | None = None,
) -> pd.DataFrame:
    if pair_colors:
        harmonized = candidates[
            candidates["colors_clean"].apply(lambda c: colors_harmonize(c, pair_colors))
        ]
        if not harmonized.empty:
            return harmonized

    if role in {"shoes", "bag"}:
        neutral = candidates[candidates["colors_clean"].apply(is_neutral_color)]
        compatible = candidates[
            candidates["colors_clean"].apply(lambda c: is_color_compatible(seed_colors, c))
        ]
        combined = pd.concat([neutral, compatible]).drop_duplicates(subset=["id"])
        if not combined.empty:
            return combined
    else:
        compatible = candidates[
            candidates["colors_clean"].apply(lambda c: is_color_compatible(seed_colors, c))
        ]
        if not compatible.empty:
            return compatible

    fallback = candidates[
        candidates["colors_clean"].apply(
            lambda x: any(c in x for c in ["black", "white", "beige"])
        )
    ]
    return fallback if not fallback.empty else candidates


def collect_outfit_colors(outfit: dict) -> list[list[str]]:
    colors: list[list[str]] = []
    for key, item in outfit.items():
        if key != "seed" and isinstance(item, dict):
            colors.append(item.get("colors_clean", []))
    return colors


def get_palette_rule_score(
    seed_colors: list[str],
    candidate_colors: list[str],
    outfit: dict[str, Any],
) -> float:
    """Apply 2+1 palette rule: <=3 colors, at least one neutral, limited seed repeats."""
    existing_groups: list[list[str]] = []
    for item in outfit.values():
        if isinstance(item, dict):
            existing_groups.append(item.get("colors_clean", []))

    combined_groups = [*existing_groups, candidate_colors]
    palette = {c for group in combined_groups for c in group}

    score = 0.0
    max_colors = int(SCORING.get("palette_max_colors", 3))
    if len(palette) > max_colors:
        score += SCORING.get("palette_overflow_penalty", -1.0) * (len(palette) - max_colors)

    has_neutral = any(c in NEUTRAL_COLORS for c in palette)
    if not has_neutral:
        score += SCORING.get("missing_neutral_penalty", -1.0)

    seed_set = set(seed_colors)
    seed_piece_count = sum(1 for group in combined_groups if seed_set & set(group))
    max_seed_repeats = int(SCORING.get("seed_max_repeats", 2))
    if seed_piece_count > max_seed_repeats:
        score += SCORING.get("seed_repeat_penalty", -1.0) * (
            seed_piece_count - max_seed_repeats
        )
    else:
        score += SCORING.get("palette_rule_bonus", 0.8)

    return score


def prepare_products_dataframe(raw_df: pd.DataFrame) -> pd.DataFrame:
    df = raw_df.copy()
    df["id"] = pd.to_numeric(df["id"], errors="coerce").fillna(0).astype(int)

    df["colors_clean"] = df["colors"].apply(safe_json_load).apply(flatten_and_lower)
    df["season_clean"] = df["season"].apply(safe_json_load).apply(flatten_and_lower)
    df["tags_clean"] = df["tags"].apply(safe_json_load).apply(flatten_and_lower)
    df["product_group"] = df.apply(
        lambda row: resolve_product_group(row["tags_clean"], row.get("name")),
        axis=1,
    )

    def create_text_profile(row: pd.Series) -> str:
        brand = row.get("brand")
        brand_part = f" Marka: {brand}." if brand else ""
        return (
            f"Ürün: {row.get('name', '')}. "
            f"Açıklama: {row.get('description', '')}.{brand_part} "
            f"Renkler: {', '.join(row['colors_clean'])}. "
            f"Etiketler: {', '.join(row['tags_clean'])}."
        )

    df["text_profile"] = df.apply(create_text_profile, axis=1)
    return df


class UltimateColorAndStyleStrictRecommender:
    def __init__(self, dataframe: pd.DataFrame, embeddings: np.ndarray, ground_truth: list[dict]):
        self.df = dataframe.copy()
        self.embeddings = embeddings
        self.ground_truth = ground_truth
        self.df["id"] = self.df["id"].astype(int)

        self.co_occurrence: set[tuple[int, int]] = set()
        for outfit in ground_truth:
            parcalar = outfit["parcalar"]
            for p1 in parcalar:
                for p2 in parcalar:
                    if p1 != p2:
                        self.co_occurrence.add((int(p1), int(p2)))

    def _get_similarity(self, seed_idx: int, candidate_indices: list[int]) -> np.ndarray:
        seed_emb = self.embeddings[seed_idx].reshape(1, -1)
        cand_embs = self.embeddings[candidate_indices]
        return cosine_similarity(seed_emb, cand_embs)[0]

    def _detect_context_style(self, seed_tags: set[str]) -> str | None:
        styles = ["casual", "office", "school", "chic", "party", "formal", "sport"]
        for s in styles:
            if s in seed_tags:
                return s
        return None

    def generate_outfit(self, seed_id: int) -> dict[str, Any] | str:
        seed_id = int(seed_id)
        if seed_id not in self.df["id"].values:
            return "Ürün bulunamadı."

        seed_row = self.df[self.df["id"] == seed_id].iloc[0]
        seed_idx = int(self.df[self.df["id"] == seed_id].index[0])
        curated = CURATED_SEED_OUTFITS.get(str(seed_id))
        if curated:
            outfit: dict[str, Any] = {"seed": seed_row}
            for role, product_id in curated.items():
                row = self.df[self.df["id"] == int(product_id)]
                if row.empty:
                    continue
                outfit[role] = row.iloc[0]
            if len(outfit) > 1:
                return outfit

        seed_group = seed_row["product_group"]
        seed_seasons = set(seed_row["season_clean"])
        seed_tags = set(seed_row["tags_clean"])
        seed_colors = seed_row["colors_clean"]
        seed_text = str(seed_row["text_profile"]).lower()

        detected_style = self._detect_context_style(seed_tags)
        is_party = "party" in seed_tags
        is_sport_seed = "sport" in seed_tags or "sport" in seed_text

        is_cold_season = any(s in seed_seasons for s in ["winter", "autumn"])
        is_pure_summer = "summer" in seed_seasons and not is_cold_season

        outfit: dict[str, Any] = {"seed": seed_row}

        upper_groups = ["blouse", "sweater", "shirt", "cardigan", "t-shirt"]
        lower_groups = ["pants", "denim", "mini skirt", "long skirt", "shorts"]
        shoes_groups = ["sandal", "boots", "sneakers", "heels"]
        accessory_groups = ["earrings", "bracelet", "necklace", "sunglasses", "ring"]
        outerwear_groups = ["jacket", "coats", "trench_coat", "blazer"]

        roles_to_fill: list[str] = []
        if seed_group == "dress":
            pass
        elif seed_group in upper_groups:
            roles_to_fill.append("lower")
        elif seed_group in lower_groups:
            roles_to_fill.append("upper")
        else:
            roles_to_fill.extend(["upper", "lower"])

        if seed_group not in shoes_groups:
            roles_to_fill.append("shoes")
        if seed_group != "bags":
            roles_to_fill.append("bag")
        if seed_group not in outerwear_groups:
            roles_to_fill.append("outerwear")

        current_accessory_groups = accessory_groups.copy()
        if is_cold_season and "sunglasses" in current_accessory_groups:
            current_accessory_groups.remove("sunglasses")

        if is_party and seed_group not in accessory_groups:
            roles_to_fill.extend(["accessory_1", "accessory_2"])
        elif seed_group not in accessory_groups:
            roles_to_fill.append("accessory")

        role_categories = {
            "upper": upper_groups,
            "lower": lower_groups,
            "shoes": shoes_groups,
            "bag": ["bags"],
            "outerwear": outerwear_groups,
            "accessory": current_accessory_groups,
            "accessory_1": current_accessory_groups,
            "accessory_2": current_accessory_groups,
        }

        for role in roles_to_fill:
            if role == "outerwear" and seed_group in {"sweater", "cardigan"}:
                # Knit seeds are already layered; outerwear often becomes noisy.
                continue

            allowed_groups = role_categories[role]
            candidates = self.df[self.df["product_group"].isin(allowed_groups)]
            if candidates.empty:
                continue

            # Upper knit/shirt seeds usually pair better with pants-denim first.
            if role == "lower" and seed_group in {"sweater", "cardigan", "shirt", "t-shirt", "blouse"}:
                preferred_lower = candidates[
                    candidates["product_group"].isin(["pants", "denim"])
                ]
                if not preferred_lower.empty:
                    candidates = preferred_lower

            # For knit seeds, prioritize lighter outer layers before heavy coats.
            if role == "outerwear" and seed_group in {"sweater", "cardigan"}:
                preferred_outer = candidates[
                    candidates["product_group"].isin(["jacket", "blazer", "trench_coat"])
                ]
                if not preferred_outer.empty:
                    candidates = preferred_outer

            train_match = candidates[
                candidates["id"].apply(lambda cid: (int(seed_id), int(cid)) in self.co_occurrence)
            ]

            if is_sport_seed:
                sport_train = train_match[train_match["tags_clean"].apply(lambda x: "sport" in x)]
                if not sport_train.empty:
                    train_match = sport_train
            else:
                non_sport_train = train_match[
                    ~train_match["tags_clean"].apply(lambda x: "sport" in x)
                ]
                if not non_sport_train.empty:
                    train_match = non_sport_train

            if role == "accessory_2" and "accessory_1" in outfit:
                acc1_group = outfit["accessory_1"]["product_group"]
                train_match = train_match[train_match["product_group"] != acc1_group]

            if not train_match.empty:
                outfit[role] = train_match.iloc[0]
                continue

            pair_colors: list[str] | None = None
            if role == "bag" and "shoes" in outfit:
                pair_colors = outfit["shoes"]["colors_clean"]
            elif role == "shoes" and "bag" in outfit:
                pair_colors = outfit["bag"]["colors_clean"]

            color_filtered = filter_candidates_by_role(role, seed_colors, candidates, pair_colors)
            if not color_filtered.empty:
                candidates = color_filtered

            if role == "accessory_2" and "accessory_1" in outfit:
                acc1_group = outfit["accessory_1"]["product_group"]
                diff_group = candidates[candidates["product_group"] != acc1_group]
                if not diff_group.empty:
                    candidates = diff_group

            if is_party:
                party_cands = candidates[candidates["tags_clean"].apply(lambda x: "party" in x)]
                if not party_cands.empty:
                    candidates = party_cands
            elif is_sport_seed:
                sport_cands = candidates[candidates["tags_clean"].apply(lambda x: "sport" in x)]
                if not sport_cands.empty:
                    candidates = sport_cands
            elif any(t in seed_tags for t in ["formal", "chic"]):
                formal_chic = candidates[
                    candidates["tags_clean"].apply(
                        lambda x: any(t in x for t in ["formal", "chic"])
                    )
                ]
                if not formal_chic.empty:
                    candidates = formal_chic

            if not is_sport_seed:
                non_sport = candidates[~candidates["tags_clean"].apply(lambda x: "sport" in x)]
                if not non_sport.empty:
                    candidates = non_sport

            if is_pure_summer:
                candidates = candidates[candidates["season_clean"].apply(lambda x: "summer" in x)]
                candidates = candidates[~candidates["product_group"].isin(["boots", "coats"])]
            else:
                candidates = candidates[
                    candidates["season_clean"].apply(
                        lambda x: len(set(x).intersection(seed_seasons)) > 0
                    )
                ]
                candidates = candidates[candidates["product_group"] != "sunglasses"]

            if candidates.empty:
                candidates = self.df[self.df["product_group"].isin(allowed_groups)]

            cand_indices = candidates.index.tolist()
            scores = self._get_similarity(seed_idx, cand_indices)
            candidates = candidates.copy()
            candidates["final_score"] = scores

            outfit_colors = collect_outfit_colors(outfit)

            if detected_style:
                candidates["final_score"] += candidates["tags_clean"].apply(
                    lambda x: SCORING["style_tag_bonus"] if detected_style in x else 0.0
                )

            candidates["color_bonus"] = candidates["colors_clean"].apply(
                lambda c: get_role_color_score(
                    role, seed_colors, c, outfit_colors, pair_colors
                )
                + monochromatic_penalty(role, c, outfit_colors)
                + get_palette_rule_score(seed_colors, c, outfit)
            )
            candidates["final_score"] += candidates["color_bonus"]
            candidates = candidates.sort_values(by="final_score", ascending=False)

            if pair_colors:
                matching = candidates[
                    candidates["colors_clean"].apply(
                        lambda c: colors_harmonize(c, pair_colors)
                    )
                ]
                if not matching.empty:
                    candidates = matching

            outfit[role] = candidates.iloc[0]

        if not is_cold_season and "outerwear" in outfit:
            del outfit["outerwear"]

        return outfit
