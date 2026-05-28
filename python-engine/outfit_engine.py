"""Colab outfit recommender: tag-based grouping, color rules, co-occurrence memory."""

from __future__ import annotations

import ast
import json
from typing import Any

import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

GROUND_TRUTH_OUTFITS = [
    {"stil": "casual", "parcalar": [546, 537, 656, 766, 678]},
    {"stil": "office", "parcalar": [113, 566, 812, 683, 638]},
    {"stil": "office", "parcalar": [282, 552, 786, 336, 701, 664]},
    {"stil": "chic", "parcalar": [148, 754, 601, 708]},
    {"stil": "chic", "parcalar": [184, 814, 609, 685]},
    {"stil": "formal", "parcalar": [526, 523, 603, 710]},
    {"stil": "school", "parcalar": [67, 431, 614, 767, 681]},
    {"stil": "party", "parcalar": [185, 427, 803, 616, 723, 722]},
    {"stil": "party", "parcalar": [569, 255, 18, 375, 673, 716]},
    {"stil": "party", "parcalar": [133, 802, 609, 722, 723]},
]

COLOR_MATCH_MAP = {
    "black": [
        "black",
        "white",
        "grey",
        "gray",
        "beige",
        "cream",
        "red",
        "blue",
        "navy",
        "dark blue",
        "gold",
        "silver",
        "green",
    ],
    "white": [
        "white",
        "black",
        "grey",
        "gray",
        "beige",
        "cream",
        "blue",
        "denim",
        "navy",
        "dark blue",
        "gold",
        "silver",
        "green",
    ],
    "green": ["black", "white"],
    "navy": ["navy", "dark blue", "blue", "white", "grey", "gray", "beige", "cream"],
    "dark blue": ["navy", "dark blue", "blue", "white", "grey", "gray", "beige", "cream"],
    "blue": ["blue", "navy", "dark blue", "white", "grey", "gray", "denim"],
    "denim": ["denim", "white", "black", "grey", "blue"],
    "beige": ["beige", "cream", "white", "black", "brown", "khaki", "natural"],
    "natural": ["natural", "beige", "cream", "white", "black", "brown"],
    "cream": ["cream", "beige", "white", "black", "brown"],
    "brown": ["brown", "beige", "cream", "black", "khaki", "natural"],
    "grey": ["grey", "gray", "white", "black", "navy", "dark blue", "blue"],
    "gray": ["gray", "grey", "white", "black", "navy", "dark blue", "blue"],
    "gold": ["gold", "black", "white", "cream", "beige", "green", "red"],
    "silver": ["silver", "black", "white", "grey", "gray", "blue", "green"],
}


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


def get_color_score(seed_colors: list[str], candidate_colors: list[str]) -> float:
    if not seed_colors or not candidate_colors:
        return 0.1
    score = 0.0
    for sc in seed_colors:
        for cc in candidate_colors:
            if sc == cc:
                score += 2.5
            elif sc in COLOR_MATCH_MAP and cc in COLOR_MATCH_MAP[sc]:
                score += 0.5
            else:
                score -= 1.5
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
        return (
            f"Ürün: {row.get('name', '')}. "
            f"Açıklama: {row.get('description', '')}. "
            f"Marka: {row.get('brand', '')}. "
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

        seed_group = seed_row["product_group"]
        seed_seasons = set(seed_row["season_clean"])
        seed_tags = set(seed_row["tags_clean"])
        seed_colors = seed_row["colors_clean"]
        seed_text = str(seed_row["text_profile"]).lower()

        detected_style = self._detect_context_style(seed_tags)
        is_party = "party" in seed_tags

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
            allowed_groups = role_categories[role]
            candidates = self.df[self.df["product_group"].isin(allowed_groups)]
            if candidates.empty:
                continue

            train_match = candidates[
                candidates["id"].apply(lambda cid: (int(seed_id), int(cid)) in self.co_occurrence)
            ]

            if role == "accessory_2" and "accessory_1" in outfit:
                acc1_group = outfit["accessory_1"]["product_group"]
                train_match = train_match[train_match["product_group"] != acc1_group]

            if not train_match.empty:
                outfit[role] = train_match.iloc[0]
                continue

            color_filtered = candidates[
                candidates["colors_clean"].apply(lambda c: is_color_compatible(seed_colors, c))
            ]
            if not color_filtered.empty:
                candidates = color_filtered
            else:
                candidates = candidates[
                    candidates["colors_clean"].apply(lambda x: any(c in x for c in ["black", "white"]))
                ]

            if role == "accessory_2" and "accessory_1" in outfit:
                acc1_colors = set(outfit["accessory_1"]["colors_clean"])
                same_color = candidates[
                    candidates["colors_clean"].apply(
                        lambda x: len(set(x).intersection(acc1_colors)) > 0
                    )
                ]
                if not same_color.empty:
                    candidates = same_color

                acc1_group = outfit["accessory_1"]["product_group"]
                diff_group = candidates[candidates["product_group"] != acc1_group]
                if not diff_group.empty:
                    candidates = diff_group

            if is_party:
                party_cands = candidates[candidates["tags_clean"].apply(lambda x: "party" in x)]
                if not party_cands.empty:
                    candidates = party_cands
            elif "sport" in seed_tags or "sport" in seed_text:
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

            if detected_style:
                candidates["final_score"] += candidates["tags_clean"].apply(
                    lambda x: 0.25 if detected_style in x else 0.0
                )

            candidates["color_bonus"] = candidates["colors_clean"].apply(
                lambda c: get_color_score(seed_colors, c)
            )
            candidates["final_score"] += candidates["color_bonus"]
            candidates = candidates.sort_values(by="final_score", ascending=False)

            if role == "bag" and "shoes" in outfit:
                shoe_colors = outfit["shoes"]["colors_clean"]
                matching = candidates[
                    candidates["colors_clean"].apply(
                        lambda x: len(set(x).intersection(set(shoe_colors))) > 0
                    )
                ]
                if not matching.empty:
                    outfit[role] = matching.iloc[0]
                    continue

            if role == "shoes" and "bag" in outfit:
                bag_colors = outfit["bag"]["colors_clean"]
                matching = candidates[
                    candidates["colors_clean"].apply(
                        lambda x: len(set(x).intersection(set(bag_colors))) > 0
                    )
                ]
                if not matching.empty:
                    outfit[role] = matching.iloc[0]
                    continue

            outfit[role] = candidates.iloc[0]

        if not is_cold_season and "outerwear" in outfit:
            del outfit["outerwear"]

        return outfit
