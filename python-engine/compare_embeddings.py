"""
Baseline vs fine-tuned embedding karsilastirmasi.

Metrikler:
  - Positive pair similarity (train / test kombinleri ayri)
  - Negative pair similarity (farkli kombinlerden rastgele ciftler)
  - Positive - negative margin
  - Recall@5 / Recall@10 (seed urunden kombin parcalari siralama)

Test kombinleri evaluation_split.py ile fine-tuning'den cikarilir
(casual, office, chic, formal — cesitli stiller).

Kullanim:
  python compare_embeddings.py
"""

from __future__ import annotations

import json
import os
import random
from itertools import combinations

import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

from evaluation_split import split_outfits, split_summary
from outfit_engine_metrics import evaluate_outfit_engine, evaluate_outfit_engine_embeddings
from product_loader import load_products

BASE_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
FINETUNED_DIR = os.path.join(os.path.dirname(__file__), "models", "elegant-minilm-finetuned")
REPORT_PATH = os.path.join(os.path.dirname(__file__), "data", "embedding_comparison.json")

NEGATIVE_PAIR_SAMPLES = 500
RECALL_K = (5, 10)
RANDOM_SEED = 42


def _encode_all(model: SentenceTransformer, df: pd.DataFrame) -> tuple[dict[int, np.ndarray], dict[int, str]]:
    by_id = {int(r["id"]): str(r["text_profile"]) for _, r in df.iterrows()}
    ids = list(by_id.keys())
    texts = [by_id[i] for i in ids]
    matrix = model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
    emb_by_id = {pid: matrix[i] for i, pid in enumerate(ids)}
    return emb_by_id, by_id


def positive_pair_similarity(
    emb_by_id: dict[int, np.ndarray],
    by_id: dict[int, str],
    outfits: list[dict],
) -> float:
    sims: list[float] = []
    for outfit in outfits:
        ids = [pid for pid in outfit["parcalar"] if pid in by_id]
        if len(ids) < 2:
            continue
        for a, b in combinations(ids, 2):
            sims.append(float(cosine_similarity(emb_by_id[a].reshape(1, -1), emb_by_id[b].reshape(1, -1))[0, 0]))
    return float(np.mean(sims)) if sims else 0.0


def negative_pair_similarity(
    emb_by_id: dict[int, np.ndarray],
    outfits: list[dict],
    n_samples: int = NEGATIVE_PAIR_SAMPLES,
) -> float:
    rng = random.Random(RANDOM_SEED)
    outfit_ids = [[pid for pid in o["parcalar"] if pid in emb_by_id] for o in outfits]
    outfit_ids = [g for g in outfit_ids if len(g) >= 1]
    if len(outfit_ids) < 2:
        return 0.0

    co_occurrence: set[tuple[int, int]] = set()
    for group in outfit_ids:
        for a in group:
            for b in group:
                if a != b:
                    co_occurrence.add((min(a, b), max(a, b)))

    sims: list[float] = []
    attempts = 0
    while len(sims) < n_samples and attempts < n_samples * 20:
        attempts += 1
        g1, g2 = rng.sample(range(len(outfit_ids)), 2)
        a = rng.choice(outfit_ids[g1])
        b = rng.choice(outfit_ids[g2])
        key = (min(a, b), max(a, b))
        if key in co_occurrence or a == b:
            continue
        sims.append(float(cosine_similarity(emb_by_id[a].reshape(1, -1), emb_by_id[b].reshape(1, -1))[0, 0]))
    return float(np.mean(sims)) if sims else 0.0


def recall_at_k(
    emb_by_id: dict[int, np.ndarray],
    by_id: dict[int, str],
    outfits: list[dict],
    k_values: tuple[int, ...] = RECALL_K,
) -> dict[str, float]:
    all_ids = np.array(list(by_id.keys()))
    all_emb = np.stack([emb_by_id[i] for i in all_ids])

    results: dict[str, list[float]] = {f"recall@{k}": [] for k in k_values}

    for outfit in outfits:
        parcalar = [pid for pid in outfit["parcalar"] if pid in by_id]
        if len(parcalar) < 2:
            continue
        seed_id = parcalar[0]
        expected = set(parcalar[1:])
        seed_emb = emb_by_id[seed_id].reshape(1, -1)
        scores = cosine_similarity(seed_emb, all_emb)[0]
        ranked = all_ids[np.argsort(-scores)]
        ranked_others = [int(pid) for pid in ranked if int(pid) != seed_id]

        for k in k_values:
            top_k = set(ranked_others[:k])
            hits = len(expected & top_k)
            results[f"recall@{k}"].append(hits / len(expected))

    return {key: round(float(np.mean(vals)), 4) if vals else 0.0 for key, vals in results.items()}


def evaluate_model(model: SentenceTransformer, df: pd.DataFrame, train_outfits: list[dict], test_outfits: list[dict]) -> dict:
    emb_by_id, by_id = _encode_all(model, df)
    all_outfits = train_outfits + test_outfits

    pos_train = positive_pair_similarity(emb_by_id, by_id, train_outfits)
    pos_test = positive_pair_similarity(emb_by_id, by_id, test_outfits)
    pos_all = positive_pair_similarity(emb_by_id, by_id, all_outfits)
    neg = negative_pair_similarity(emb_by_id, all_outfits)
    recall_test = recall_at_k(emb_by_id, by_id, test_outfits)

    return {
        "positive_pair_similarity": {
            "train_outfits": round(pos_train, 4),
            "test_outfits_holdout": round(pos_test, 4),
            "all_ground_truth": round(pos_all, 4),
        },
        "negative_pair_similarity": round(neg, 4),
        "positive_minus_negative_margin": {
            "train": round(pos_train - neg, 4),
            "test_holdout": round(pos_test - neg, 4),
        },
        "recall_on_test_outfits": recall_test,
    }


def main() -> None:
    train_outfits, test_outfits = split_outfits()
    df = load_products()

    print(f"Train kombin: {len(train_outfits)}, test (hold-out): {len(test_outfits)}")
    print("Baseline model degerlendiriliyor...")
    baseline = SentenceTransformer(BASE_MODEL)
    baseline_metrics = evaluate_model(baseline, df, train_outfits, test_outfits)

    if not os.path.isdir(FINETUNED_DIR):
        print(f"Fine-tuned model bulunamadi: {FINETUNED_DIR}")
        print("Once calistirin: python finetune.py")
        return

    print("Fine-tuned model degerlendiriliyor...")
    finetuned = SentenceTransformer(FINETUNED_DIR)
    finetuned_metrics = evaluate_model(finetuned, df, train_outfits, test_outfits)

    print("Outfit motoru hit rate hesaplaniyor (baseline)...")
    baseline_outfit = evaluate_outfit_engine(baseline, df, train_outfits, test_outfits)
    print("Outfit motoru hit rate hesaplaniyor (fine-tuned)...")
    finetuned_outfit = evaluate_outfit_engine(finetuned, df, train_outfits, test_outfits)

    visual_section: dict | None = None
    if os.environ.get("SKIP_VISUAL_COMPARE", "").lower() not in ("1", "true", "yes"):
        try:
            from visual_embeddings import VISUAL_MODEL_NAME, build_visual_embeddings

            print("Gorsel CLIP embedding degerlendiriliyor...")
            df_img = load_products(include_image=True)
            visual_matrix, visual_stats = build_visual_embeddings(df_img, None)
            id_to_idx = {int(row["id"]): i for i, row in df_img.iterrows()}
            emb_by_id = {
                pid: visual_matrix[idx] for pid, idx in id_to_idx.items()
            }
            by_id = {int(r["id"]): str(r.get("image_url") or "") for _, r in df_img.iterrows()}

            visual_outfit = evaluate_outfit_engine_embeddings(
                df_img, visual_matrix, train_outfits, test_outfits
            )
            visual_section = {
                "model": VISUAL_MODEL_NAME,
                "build_stats": visual_stats,
                "positive_pair_similarity": {
                    "train_outfits": round(
                        positive_pair_similarity(emb_by_id, by_id, train_outfits), 4
                    ),
                    "test_outfits_holdout": round(
                        positive_pair_similarity(emb_by_id, by_id, test_outfits), 4
                    ),
                },
                "negative_pair_similarity": round(
                    negative_pair_similarity(emb_by_id, train_outfits + test_outfits), 4
                ),
                "recall_on_test_outfits": recall_at_k(emb_by_id, by_id, test_outfits),
                "outfit_engine_hit_rate": {
                    "train": visual_outfit["train_outfits"]["avg_hit_rate"],
                    "test_holdout": visual_outfit["test_outfits_holdout"]["avg_hit_rate"],
                    "test_details": visual_outfit["test_outfits_holdout"]["details"],
                },
            }
            visual_section["positive_minus_negative_margin"] = {
                "test_holdout": round(
                    visual_section["positive_pair_similarity"]["test_outfits_holdout"]
                    - visual_section["negative_pair_similarity"],
                    4,
                ),
            }
        except Exception as exc:
            visual_section = {"error": str(exc)}

    def delta(a: dict, b: dict, key: str) -> float | dict:
        va, vb = a.get(key), b.get(key)
        if isinstance(va, dict) and isinstance(vb, dict):
            return {k: round(vb[k] - va[k], 4) for k in va}
        return round(float(vb) - float(va), 4)

    report = {
        "baseline_model": BASE_MODEL,
        "finetuned_model": FINETUNED_DIR,
        "evaluation_setup": {
            **split_summary(),
            "negative_pair_samples": NEGATIVE_PAIR_SAMPLES,
            "note": (
                "finetune.py, TEST_OUTFIT_INDICES kombinlerini ve bu kombinlerdeki urunleri "
                "stil/sezon ciftlerinden de cikarir. Mevcut model eski egitimle uretildiyse "
                "yeniden calistirin: python finetune.py && python compare_embeddings.py"
            ),
        },
        "baseline": baseline_metrics,
        "finetuned": finetuned_metrics,
        "outfit_engine_hit_rate": {
            "baseline": {
                "train": baseline_outfit["train_outfits"]["avg_hit_rate"],
                "test_holdout": baseline_outfit["test_outfits_holdout"]["avg_hit_rate"],
            },
            "finetuned": {
                "train": finetuned_outfit["train_outfits"]["avg_hit_rate"],
                "test_holdout": finetuned_outfit["test_outfits_holdout"]["avg_hit_rate"],
            },
            "delta_test_holdout": round(
                finetuned_outfit["test_outfits_holdout"]["avg_hit_rate"]
                - baseline_outfit["test_outfits_holdout"]["avg_hit_rate"],
                4,
            ),
            "test_details_finetuned": finetuned_outfit["test_outfits_holdout"]["details"],
        },
        "delta_finetuned_minus_baseline": {
            "positive_test_holdout": delta(
                baseline_metrics["positive_pair_similarity"],
                finetuned_metrics["positive_pair_similarity"],
                "test_outfits_holdout",
            ),
            "negative_pair_similarity": delta(
                baseline_metrics, finetuned_metrics, "negative_pair_similarity"
            ),
            "margin_test_holdout": delta(
                baseline_metrics["positive_minus_negative_margin"],
                finetuned_metrics["positive_minus_negative_margin"],
                "test_holdout",
            ),
            "recall_on_test": {
                k: round(
                    finetuned_metrics["recall_on_test_outfits"][k]
                    - baseline_metrics["recall_on_test_outfits"][k],
                    4,
                )
                for k in finetuned_metrics["recall_on_test_outfits"]
            },
        },
        "visual_clip": visual_section,
        "interpretation_for_report": (
            "Ana metrikler: hold-out test margin (embedding ayrimi) ve outfit engine hit rate "
            "(gercek generate_outfit ciktisi). Recall@K saf embedding siralamasidir; "
            "kullaniciya gorunen sonuc kural tabanli outfit motorundan gelir. "
            "visual_clip: CLIP gorsel embedding (metin fine-tune ile kiyaslanabilir)."
        ),
        "legacy_metric_all_gt_pairs": {
            "baseline": baseline_metrics["positive_pair_similarity"]["all_ground_truth"],
            "finetuned": finetuned_metrics["positive_pair_similarity"]["all_ground_truth"],
            "delta": round(
                finetuned_metrics["positive_pair_similarity"]["all_ground_truth"]
                - baseline_metrics["positive_pair_similarity"]["all_ground_truth"],
                4,
            ),
        },
    }

    os.makedirs(os.path.dirname(REPORT_PATH), exist_ok=True)
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(json.dumps(report, ensure_ascii=False, indent=2))
    print(f"Rapor: {REPORT_PATH}")


if __name__ == "__main__":
    main()
