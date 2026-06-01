"""
Fine-tuning ve degerlendirme icin ortak train/test ayrimi.

Hold-out kombinler farkli stillerden secilir (sadece party degil).
finetune.py ve compare_embeddings.py ayni indeksleri kullanir.
"""

from __future__ import annotations

from outfit_engine import GROUND_TRUTH_OUTFITS

# casual, office, chic, formal — cesitli stiller
TEST_OUTFIT_INDICES: set[int] = {0, 1, 3, 5}


def split_outfits() -> tuple[list[dict], list[dict]]:
    train = [o for i, o in enumerate(GROUND_TRUTH_OUTFITS) if i not in TEST_OUTFIT_INDICES]
    test = [o for i, o in enumerate(GROUND_TRUTH_OUTFITS) if i in TEST_OUTFIT_INDICES]
    return train, test


def test_product_ids() -> set[int]:
    ids: set[int] = set()
    for i, outfit in enumerate(GROUND_TRUTH_OUTFITS):
        if i in TEST_OUTFIT_INDICES:
            ids.update(int(p) for p in outfit["parcalar"])
    return ids


def split_summary() -> dict:
    _, test = split_outfits()
    train, _ = split_outfits()
    return {
        "test_outfit_indices": sorted(TEST_OUTFIT_INDICES),
        "test_outfit_styles": [o["stil"] for o in test],
        "train_outfit_count": len(train),
        "test_outfit_count": len(test),
        "test_product_ids": sorted(test_product_ids()),
    }
