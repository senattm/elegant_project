"""
Ground truth kombin setine karşı outfit motorunu değerlendirir.
Kullanım: python evaluate.py
"""

from __future__ import annotations

import json
import os
import sys

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

sys.path.insert(0, os.path.dirname(__file__))

from outfit_engine import GROUND_TRUTH_OUTFITS, UltimateColorAndStyleStrictRecommender
from product_loader import load_products

try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    SentenceTransformer = None


def load_engine():
    df = load_products()

    if SentenceTransformer is None:
        raise RuntimeError("sentence-transformers kurulu değil")

    model_name = os.environ.get(
        "EMBEDDING_MODEL", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    )
    model = SentenceTransformer(model_name)
    embeddings = model.encode(df["text_profile"].tolist(), convert_to_numpy=True)
    recommender = UltimateColorAndStyleStrictRecommender(df, embeddings, GROUND_TRUTH_OUTFITS)
    return recommender, df


def evaluate(recommender, df: pd.DataFrame) -> dict:
    results = []
    hit_rates = []
    cohesions = []

    id_to_idx = {int(row["id"]): i for i, row in df.iterrows()}

    for gt in GROUND_TRUTH_OUTFITS:
        seed_id = gt["parcalar"][0]
        outfit = recommender.generate_outfit(seed_id)
        if isinstance(outfit, str):
            continue

        generated_ids = {int(v["id"]) for k, v in outfit.items() if k != "seed"}
        expected_ids = set(gt["parcalar"]) - {seed_id}

        hits = len(generated_ids & expected_ids)
        hit_rate = hits / len(expected_ids) if expected_ids else 0
        hit_rates.append(hit_rate)

        indices = [id_to_idx[pid] for pid in generated_ids if pid in id_to_idx]
        cohesion = 0.0
        if len(indices) >= 2:
            sub = recommender.embeddings[indices]
            sim = cosine_similarity(sub)
            upper = sim[np.triu_indices(len(indices), k=1)]
            cohesion = float(np.mean(upper)) if len(upper) else 0.0
        cohesions.append(cohesion * 100)

        results.append(
            {
                "style": gt["stil"],
                "seed_id": seed_id,
                "expected": sorted(expected_ids),
                "generated": sorted(generated_ids),
                "hit_rate": round(hit_rate, 3),
                "cohesion_pct": round(cohesion * 100, 1),
            }
        )

    report = {
        "engine": "python-engine (sentence-transformers)",
        "total_ground_truth_outfits": len(results),
        "avg_hit_rate": round(float(np.mean(hit_rates)), 3) if hit_rates else 0,
        "avg_cohesion_pct": round(float(np.mean(cohesions)), 1) if cohesions else 0,
        "details": results,
    }
    return report


def main():
    print("Outfit motoru değerlendiriliyor...")
    recommender, df = load_engine()
    report = evaluate(recommender, df)
    out_path = os.path.join(os.path.dirname(__file__), "data", "evaluation_report.json")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    print(f"\nRapor kaydedildi: {out_path}")


if __name__ == "__main__":
    main()
