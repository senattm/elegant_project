"""
Urun metinleri uzerinde sentence-transformer fine-tuning.

Modlar (FINETUNE_MODE):
  both    — MNRL 1 epoch + TripletLoss 1 epoch (varsayilan)
  mnrl    — sadece MultipleNegativesRankingLoss
  triplet — sadece TripletLoss + kontrollu negatifler

Ornek:
  FINETUNE_MODE=both MNRL_EPOCHS=1 TRIPLET_EPOCHS=1 TRIPLET_MARGIN=0.2 python finetune.py
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone

from sentence_transformers import InputExample, SentenceTransformer, losses
from torch.utils.data import DataLoader

from evaluation_split import split_summary
from product_loader import load_products
from training_data import build_training_pairs, build_training_triplets

BASE_MODEL = os.environ.get(
    "BASE_MODEL", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
)
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "models", "elegant-minilm-finetuned")
REPORT_PATH = os.path.join(os.path.dirname(__file__), "data", "finetune_report.json")
FINETUNE_MODE = os.environ.get("FINETUNE_MODE", "both").lower()
EPOCHS = int(os.environ.get("FINETUNE_EPOCHS", "2"))
MNRL_EPOCHS = int(os.environ.get("MNRL_EPOCHS", "1"))
TRIPLET_EPOCHS = int(os.environ.get("TRIPLET_EPOCHS", "1"))
BATCH_SIZE = int(os.environ.get("FINETUNE_BATCH_SIZE", "16"))
WARMUP_STEPS = int(os.environ.get("FINETUNE_WARMUP", "50"))
TRIPLET_MARGIN = float(os.environ.get("TRIPLET_MARGIN", "0.2"))


def _fit(model: SentenceTransformer, loader: DataLoader, loss, epochs: int, save: bool) -> None:
    steps = max(10, len(loader.dataset) // BATCH_SIZE)
    model.fit(
        train_objectives=[(loader, loss)],
        epochs=epochs,
        warmup_steps=min(WARMUP_STEPS, steps),
        output_path=OUTPUT_DIR if save else None,
        show_progress_bar=True,
    )


def main() -> None:
    print("Urunler yukleniyor...")
    df = load_products()
    split = split_summary()
    print(
        f"Hold-out test kombinleri (egitimden cikarildi): "
        f"{split['test_outfit_indices']} — {split['test_outfit_styles']}"
    )

    triplets, triplet_stats = build_training_triplets(df, max_outfit_triplets=200)
    pairs = build_training_pairs(df)

    if FINETUNE_MODE == "mnrl" and len(pairs) < 10:
        raise RuntimeError(f"Yetersiz pozitif cift: {len(pairs)}")
    if FINETUNE_MODE in ("triplet", "both") and len(triplets) < 10:
        raise RuntimeError(f"Yetersiz triplet: {len(triplets)}")

    print(f"Mod: {FINETUNE_MODE} | triplet: {len(triplets)} {triplet_stats} | pozitif cift: {len(pairs)}")
    print(f"Base model yukleniyor: {BASE_MODEL}")
    model = SentenceTransformer(BASE_MODEL)
    os.makedirs(os.path.dirname(OUTPUT_DIR), exist_ok=True)

    phases: list[str] = []

    if FINETUNE_MODE in ("mnrl", "both"):
        mnrl_epochs = MNRL_EPOCHS if FINETUNE_MODE == "both" else EPOCHS
        pair_examples = [InputExample(texts=[a, b]) for a, b in pairs]
        pair_loader = DataLoader(pair_examples, shuffle=True, batch_size=BATCH_SIZE)
        mnrl_loss = losses.MultipleNegativesRankingLoss(model)
        print(f"MNRL egitimi ({mnrl_epochs} epoch)...")
        save_now = FINETUNE_MODE == "mnrl"
        _fit(model, pair_loader, mnrl_loss, mnrl_epochs, save=save_now)
        phases.append(f"MNRL x{mnrl_epochs}")

    if FINETUNE_MODE in ("triplet", "both"):
        triplet_epochs = TRIPLET_EPOCHS if FINETUNE_MODE == "both" else EPOCHS
        triplet_examples = [InputExample(texts=[a, p, n]) for a, p, n in triplets]
        triplet_loader = DataLoader(triplet_examples, shuffle=True, batch_size=BATCH_SIZE)
        triplet_loss = losses.TripletLoss(
            model=model,
            distance_metric=losses.TripletDistanceMetric.COSINE,
            triplet_margin=TRIPLET_MARGIN,
        )
        print(f"TripletLoss egitimi ({triplet_epochs} epoch, margin={TRIPLET_MARGIN})...")
        _fit(model, triplet_loader, triplet_loss, triplet_epochs, save=True)
        phases.append(f"TripletLoss x{triplet_epochs} margin={TRIPLET_MARGIN}")

    report = {
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "base_model": BASE_MODEL,
        "output_dir": OUTPUT_DIR,
        "product_count": len(df),
        "ground_truth_outfit_count": split["train_outfit_count"] + split["test_outfit_count"],
        "triplet_count": len(triplets),
        "triplet_stats": triplet_stats,
        "positive_pair_count": len(pairs),
        "finetune_mode": FINETUNE_MODE,
        "phases": phases,
        "mnrl_epochs": MNRL_EPOCHS if FINETUNE_MODE in ("mnrl", "both") else 0,
        "triplet_epochs": TRIPLET_EPOCHS if FINETUNE_MODE in ("triplet", "both") else 0,
        "batch_size": BATCH_SIZE,
        "triplet_margin": TRIPLET_MARGIN,
        "method": " + ".join(phases),
        "holdout_split": split,
        "negative_strategy": {
            "easy": "Farkli stil tag'i veya ayni urun grubu catismasi",
            "hard": "Ayni stil ama urun grubu veya sezon catismasi (GT kombininde degil)",
        },
        "data_sources": [
            "GROUND_TRUTH_OUTFITS (17 kombin, hold-out haric egitim)",
            "Ayni stil tag'ine sahip uyumlu urunler (hold-out haric)",
            "Kontrollu easy/hard negatif tripletler",
        ],
    }
    os.makedirs(os.path.dirname(REPORT_PATH), exist_ok=True)
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(f"Model kaydedildi: {OUTPUT_DIR}")
    print(f"Rapor: {REPORT_PATH}")


if __name__ == "__main__":
    main()
