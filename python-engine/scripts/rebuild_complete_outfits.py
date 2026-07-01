
from __future__ import annotations

import argparse
import json
import random
import sys
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import psycopg2

from paths import CIR_DATA_DIR, POLYVORE_IMAGES_DIR
from product_loader import database_url

SPLIT_DIRS = ("disjoint", "nondisjoint")
SPLIT_FILES = ("train.json", "valid.json", "test.json")

SEMANTIC_TO_CATEGORY_NAME = {
    "accessories": "Takı & Aksesuar",
    "all-body": "Elbise",
    "bags": "Çanta",
    "bottoms": "Alt Giyim",
    "jewellery": "Takı & Aksesuar",
    "outerwear": "Dış Giyim",
    "shoes": "Ayakkabı",
    "sunglasses": "Gözlük",
    "tops": "Üst Giyim",
}
SEMANTIC_TO_SLOT = {
    "accessories": "accessory", "jewellery": "accessory", "sunglasses": "accessory",
    "all-body": "full", "bags": "bag", "bottoms": "lower", "outerwear": "outer",
    "shoes": "footwear", "tops": "upper",
}


def load_outfit_sets(dataset_root: Path) -> dict[str, list[str]]:
    seen: dict[str, list[str]] = {}
    for split in SPLIT_DIRS:
        for fname in SPLIT_FILES:
            path = dataset_root / split / fname
            if not path.is_file():
                continue
            outfits = json.loads(path.read_text(encoding="utf-8"))
            for outfit in outfits:
                seen[outfit["set_id"]] = [it["item_id"] for it in outfit["items"]]
    return seen


def slots_for_set(items: list[str], meta: dict) -> set[str]:
    slots = set()
    for i in items:
        m = meta.get(i)
        if m:
            slot = SEMANTIC_TO_SLOT.get(m.get("semantic_category", ""))
            if slot:
                slots.add(slot)
    return slots


def is_complete(slots: set[str]) -> bool:
    has_body = "full" in slots or ("upper" in slots and "lower" in slots)
    has_core = "footwear" in slots and "bag" in slots and "accessory" in slots
    return has_body and has_core


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset-root", required=True)
    parser.add_argument("--zip", required=True)
    parser.add_argument("--target-total", type=int, default=5000)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    dataset_root = Path(args.dataset_root)
    meta = json.loads((dataset_root / "polyvore_item_metadata.json").read_text(encoding="utf-8"))

    conn = psycopg2.connect(database_url())
    cur = conn.cursor()
    cur.execute("SELECT id, source_url FROM products WHERE source = 'polyvore' AND source_url IS NOT NULL")
    rows = cur.fetchall()
    url_to_id = {str(url): pid for pid, url in rows}
    existing_urls = set(url_to_id.keys())
    cur.execute("SELECT COUNT(*) FROM products")
    current_total = cur.fetchone()[0]
    print(f"[bilgi] mevcut toplam urun: {current_total}, polyvore: {len(existing_urls)}")

    outfit_sets = load_outfit_sets(dataset_root)
    complete_sets: dict[str, list[str]] = {}
    for sid, items in outfit_sets.items():
        if is_complete(slots_for_set(items, meta)):
            complete_sets[sid] = items
    print(f"[bilgi] tam (essential slotlu) set sayisi: {len(complete_sets)}")

    item_to_complete_sets: dict[str, list[str]] = {}
    for sid, items in complete_sets.items():
        for i in items:
            item_to_complete_sets.setdefault(i, []).append(sid)

    keepable_urls = existing_urls & set(item_to_complete_sets.keys())
    deletable_urls = existing_urls - keepable_urls
    print(f"[bilgi] korunabilecek: {len(keepable_urls)}, silinecek: {len(deletable_urls)}")


    candidate_sets = []
    for url in keepable_urls:
        best_sid, best_missing = None, None
        for sid in item_to_complete_sets[url]:
            items = complete_sets[sid]
            missing = [i for i in items if i not in existing_urls]
            if best_missing is None or len(missing) < len(best_missing):
                best_sid, best_missing = sid, missing
        candidate_sets.append((best_sid, best_missing))


    unique_sets = {sid: missing for sid, missing in candidate_sets}
    ordered = sorted(unique_sets.items(), key=lambda kv: len(kv[1]))

    delete_count = len(deletable_urls)
    budget = max(0, args.target_total - (current_total - delete_count))
    print(f"[bilgi] silme sonrasi taban: {current_total - delete_count}, ekleme butcesi: {budget}")

    collected: set[str] = set()
    completed_sets = 0
    for sid, missing in ordered:
        need = [i for i in missing if i not in collected]
        if len(collected) + len(need) > budget:
            continue
        collected.update(need)
        completed_sets += 1

    print(f"[bilgi] tamamlanacak set sayisi: {completed_sets}, eklenecek yeni urun: {len(collected)}")
    net_total = current_total - delete_count + len(collected)
    print(f"[bilgi] NET TOPLAM: {current_total} -> {net_total}")

    if args.dry_run:
        print("[dry-run] DB/goruntu yazilmadi.")
        return


    delete_ids = [url_to_id[u] for u in deletable_urls]
    if delete_ids:
        cur.execute("SELECT DISTINCT product_id FROM order_items WHERE product_id = ANY(%s)", (delete_ids,))
        order_blocked = {r[0] for r in cur.fetchall()}
        if order_blocked:
            cur.execute(
                "SELECT id FROM product_variants WHERE product_id = ANY(%s)",
                (list(order_blocked),),
            )
            variant_ids = [r[0] for r in cur.fetchall()]
            if variant_ids:
                cur.execute("UPDATE order_items SET variant_id = NULL WHERE variant_id = ANY(%s)", (variant_ids,))
            cur.execute("UPDATE order_items SET product_id = NULL WHERE product_id = ANY(%s)", (list(order_blocked),))
        cur.execute("SELECT DISTINCT product_id FROM cart_items WHERE product_id = ANY(%s)", (delete_ids,))
        cart_blocked = {r[0] for r in cur.fetchall()}
        if cart_blocked:
            cur.execute("DELETE FROM cart_items WHERE product_id = ANY(%s)", (list(cart_blocked),))
        cur.execute("DELETE FROM products WHERE id = ANY(%s)", (delete_ids,))
        print(f"[OK] {len(delete_ids)} urun silindi.")


    cur.execute("SELECT id, name FROM categories")
    category_ids = {name: cid for cid, name in cur.fetchall()}

    POLYVORE_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    zf = zipfile.ZipFile(args.zip)
    zip_prefix = "polyvore-outfit-dataset/polyvore_outfits/images/"

    inserted = 0
    for item_id in collected:
        m = meta.get(item_id, {})
        semantic = m.get("semantic_category", "")
        cat_name = SEMANTIC_TO_CATEGORY_NAME.get(semantic)
        if not cat_name or cat_name not in category_ids:
            continue
        raw_name = m.get("title") or m.get("url_name") or item_id
        name = raw_name.title()[:255]

        img_dest = POLYVORE_IMAGES_DIR / f"{item_id}.jpg"
        if not img_dest.is_file():
            try:
                with zf.open(f"{zip_prefix}{item_id}.jpg") as src, open(img_dest, "wb") as dst:
                    dst.write(src.read())
            except KeyError:
                continue

        price = round(random.uniform(60, 2900), 2)
        cur.execute(
            """
            INSERT INTO products (name, price, stock, category_id, gender, source, source_url, tags, style_attrs, colors, season)
            VALUES (%s, %s, 99, %s, 'female', 'polyvore', %s, %s, %s, '[]', '[]')
            RETURNING id
            """,
            (name, price, category_ids[cat_name], item_id, json.dumps([semantic]), json.dumps({"polyvore_category": semantic})),
        )
        product_id = cur.fetchone()[0]
        cur.execute(
            "INSERT INTO product_images (product_id, image_url, is_main) VALUES (%s, %s, true)",
            (product_id, f"http://localhost:5000/polyvore-images/{item_id}.jpg"),
        )
        cur.execute(
            "INSERT INTO product_variants (product_id, size, price, stock, sku) VALUES (%s, 'Standart', %s, 10, %s)",
            (product_id, price, f"PLV-{product_id}-Standart"),
        )
        inserted += 1

    conn.commit()
    cur.close()
    conn.close()
    print(f"[OK] {inserted} yeni urun eklendi.")


if __name__ == "__main__":
    main()
