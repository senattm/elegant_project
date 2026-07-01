
from __future__ import annotations

import argparse
import json
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import psycopg2

from paths import CIR_DATA_DIR
from product_loader import database_url

OUTPUT_PATH = CIR_DATA_DIR / "catalog_real_cooccurrence.json"
SPLIT_FILES = ("train.json", "valid.json", "test.json")


def load_source_url_map() -> dict[str, int]:
    conn = psycopg2.connect(database_url())
    cur = conn.cursor()
    cur.execute("SELECT id, source_url FROM products WHERE source = 'polyvore' AND source_url IS NOT NULL")
    mapping = {str(source_url): pid for pid, source_url in cur.fetchall()}
    conn.close()
    return mapping


def build(dataset_dirs: list[Path]) -> dict[str, list[dict]]:
    by_source_url = load_source_url_map()
    counts: dict[int, dict[int, int]] = defaultdict(lambda: defaultdict(int))
    seen_set_ids: set[str] = set()
    used_sets = 0

    for dataset_dir in dataset_dirs:
        for fname in SPLIT_FILES:
            path = dataset_dir / fname
            if not path.is_file():
                print(f"[atlandi] {path} bulunamadi")
                continue
            outfits = json.loads(path.read_text(encoding="utf-8"))
            for outfit in outfits:
                set_id = outfit.get("set_id")
                if set_id in seen_set_ids:
                    continue
                matched = [
                    by_source_url[item["item_id"]]
                    for item in outfit.get("items", [])
                    if item["item_id"] in by_source_url
                ]
                if len(matched) < 2:
                    continue
                seen_set_ids.add(set_id)
                used_sets += 1
                for a in matched:
                    for b in matched:
                        if a != b:
                            counts[a][b] += 1

    result: dict[str, list[dict]] = {}
    for pid, partners in counts.items():
        ranked = sorted(partners.items(), key=lambda kv: kv[1], reverse=True)
        result[str(pid)] = [{"id": partner_id, "count": cnt} for partner_id, cnt in ranked]

    print(f"[OK] {used_sets} gercek outfit seti kullanildi.")
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--dataset-dir",
        required=True,
        action="append",
        help="polyvore_outfits/disjoint veya nondisjoint klasoru (birden fazla kez verilebilir)",
    )
    args = parser.parse_args()

    result = build([Path(d) for d in args.dataset_dir])

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(result, ensure_ascii=False), encoding="utf-8")

    total_pairs = sum(len(v) for v in result.values())
    print(f"[OK] {len(result)} urun icin gercek eslesme kaydedildi -> {OUTPUT_PATH}")
    print(f"Toplam yonlu eslesme: {total_pairs}")


if __name__ == "__main__":
    main()
