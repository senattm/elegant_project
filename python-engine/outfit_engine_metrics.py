"""Outfit motoru ground-truth hit rate metrikleri."""

from __future__ import annotations

import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

from outfit_engine import GROUND_TRUTH_OUTFITS, UltimateColorAndStyleStrictRecommender


def _build_recommender(model: SentenceTransformer, df) -> UltimateColorAndStyleStrictRecommender:
    embeddings = model.encode(
        df["text_profile"].tolist(),
        convert_to_numpy=True,
        show_progress_bar=False,
    )
    return UltimateColorAndStyleStrictRecommender(df, embeddings, GROUND_TRUTH_OUTFITS)


def outfit_hit_rate(recommender: UltimateColorAndStyleStrictRecommender, outfits: list[dict]) -> dict:
    """Seed = kombinin ilk urunu; beklenen = diger parcalar."""
    hit_rates: list[float] = []
    details: list[dict] = []

    for gt in outfits:
        parcalar = [int(p) for p in gt["parcalar"]]
        if len(parcalar) < 2:
            continue
        seed_id = parcalar[0]
        expected = set(parcalar[1:])

        outfit = recommender.generate_outfit(seed_id)
        if isinstance(outfit, str):
            details.append(
                {
                    "style": gt["stil"],
                    "seed_id": seed_id,
                    "status": outfit,
                    "hit_rate": 0.0,
                }
            )
            hit_rates.append(0.0)
            continue

        generated = {int(v["id"]) for k, v in outfit.items() if k != "seed"}
        hits = len(generated & expected)
        rate = hits / len(expected) if expected else 0.0
        hit_rates.append(rate)
        details.append(
            {
                "style": gt["stil"],
                "seed_id": seed_id,
                "expected": sorted(expected),
                "generated": sorted(generated),
                "hits": hits,
                "hit_rate": round(rate, 4),
            }
        )

    return {
        "avg_hit_rate": round(float(np.mean(hit_rates)), 4) if hit_rates else 0.0,
        "outfit_count": len(hit_rates),
        "details": details,
    }


def evaluate_outfit_engine(model: SentenceTransformer, df, train_outfits: list[dict], test_outfits: list[dict]) -> dict:
    recommender = _build_recommender(model, df)
    return {
        "train_outfits": outfit_hit_rate(recommender, train_outfits),
        "test_outfits_holdout": outfit_hit_rate(recommender, test_outfits),
    }


def evaluate_outfit_engine_embeddings(
    df, embeddings: np.ndarray, train_outfits: list[dict], test_outfits: list[dict]
) -> dict:
    recommender = UltimateColorAndStyleStrictRecommender(df, embeddings, GROUND_TRUTH_OUTFITS)
    return {
        "train_outfits": outfit_hit_rate(recommender, train_outfits),
        "test_outfits_holdout": outfit_hit_rate(recommender, test_outfits),
    }


def embedding_cohesion_pct(recommender: UltimateColorAndStyleStrictRecommender, outfits: list[dict]) -> float:
    """Uretilen kombin parcalari arasi ortalama embedding benzerligi (0-100)."""
    id_to_idx = {int(row["id"]): i for i, row in recommender.df.iterrows()}
    scores: list[float] = []

    for gt in outfits:
        parcalar = [int(p) for p in gt["parcalar"]]
        if len(parcalar) < 2:
            continue
        outfit = recommender.generate_outfit(parcalar[0])
        if isinstance(outfit, str):
            continue
        indices = [id_to_idx[int(v["id"])] for v in outfit.values() if int(v["id"]) in id_to_idx]
        if len(indices) < 2:
            continue
        sub = recommender.embeddings[indices]
        sim = cosine_similarity(sub)
        upper = sim[np.triu_indices(len(indices), k=1)]
        if len(upper):
            scores.append(float(np.mean(upper)))

    return round(float(np.mean(scores)) * 100, 1) if scores else 0.0
