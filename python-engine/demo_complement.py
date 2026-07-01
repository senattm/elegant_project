from __future__ import annotations

import argparse

import psycopg2

from cir_engine import find_complementary, precompute_catalog, reset_elegant_failed_ids
from model_loader import load_model
from product_loader import database_url, load_products, load_seed_products


def fetch_product_meta(ids: list[int]) -> dict[int, dict]:
    if not ids:
        return {}
    conn = psycopg2.connect(database_url())
    cur = conn.cursor()
    placeholders = ",".join(str(i) for i in ids)
    cur.execute(
        f"""
        SELECT p.id, p.name, COALESCE(p.source, 'elegant') AS source, c.name AS category
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.id IN ({placeholders})
        """
    )
    rows = {
        r[0]: {"name": r[1], "source": r[2], "category": r[3] or ""}
        for r in cur.fetchall()
    }
    conn.close()
    return rows


def pick_elegant_seed() -> int:
    conn = psycopg2.connect(database_url())
    cur = conn.cursor()
    cur.execute(
        """
        SELECT p.id, p.name, c.name
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        JOIN product_images pi ON pi.product_id = p.id
        WHERE COALESCE(p.source, '') != 'polyvore'
          AND c.name IS NOT NULL
        ORDER BY p.id
        LIMIT 1
        """
    )
    row = cur.fetchone()
    conn.close()
    if not row:
        raise RuntimeError("Elegant urun bulunamadi")
    return int(row[0])


def main() -> None:
    parser = argparse.ArgumentParser(description="Elegant kombin demo")
    parser.add_argument("--seed", type=int, help="Seed urun ID")
    parser.add_argument("--k", type=int, default=6, help="Oneri sayisi")
    args = parser.parse_args()

    seed_id = args.seed or pick_elegant_seed()
    print("=" * 60)
    print("ELEGANT KOMBIN DEMO")
    print("=" * 60)

    print("\n[1/4] Model yukleniyor...")
    model = load_model(model_type="clip")

    print("[2/4] Tum urunler yukleniyor (Elegant + Polyvore)...")
    cleared = reset_elegant_failed_ids()
    if cleared:
        print(f"      {cleared} Elegant urun failed-list'ten temizlendi.")

    df = load_products(include_image=True, polyvore_only=False)
    polyvore_count = int((df.get("source", "") == "polyvore").sum()) if "source" in df.columns else 0
    elegant_count = len(df) - polyvore_count
    print(f"      Katalog: {len(df)} urun ({elegant_count} Elegant, {polyvore_count} Polyvore)")

    print("[3/4] CIR index guncelleniyor (yeni Elegant urunler ekleniyor)...")
    ids, _, _ = precompute_catalog(df, model)
    print(f"      Index: {len(ids)} urun")

    seed_meta = fetch_product_meta([seed_id]).get(seed_id, {})
    print(f"\n[4/4] Kombin uretiliyor — seed #{seed_id}")
    print(f"      {seed_meta.get('name', '?')} [{seed_meta.get('source', '?')}]")
    print(f"      Kategori: {seed_meta.get('category', '?')}")

    recs = find_complementary(
        [seed_id],
        df,
        model,
        k=args.k,
        outfit_mode=True,
        seed_df=load_seed_products([seed_id]),
    )

    if not recs:
        print("\nSonuc: Oneri bulunamadi.")
        return

    meta = fetch_product_meta([r["id"] for r in recs])
    elegant_recs = 0
    polyvore_recs = 0

    print(f"\n{'-' * 60}")
    print(f"{'#':<3} {'ID':<6} {'Kaynak':<10} {'Skor':<6} {'Kategori':<18} Ad")
    print(f"{'-' * 60}")
    for rec in recs:
        m = meta.get(rec["id"], {})
        source = m.get("source") or "elegant"
        if source == "polyvore":
            polyvore_recs += 1
        else:
            elegant_recs += 1
        soft = " ~" if rec.get("_soft") else ""
        print(
            f"{rec['rank']:<3} {rec['id']:<6} {source:<10} "
            f"{rec['score']:<6.3f}{soft} {rec.get('category', m.get('category', ''))[:18]:<18} "
            f"{m.get('name', '')[:40]}"
        )

    print(f"{'-' * 60}")
    print(f"Ozet: {len(recs)} oneri - {elegant_recs} Elegant, {polyvore_recs} Polyvore")
    print(f"\nDemo basarili! Seed kaynagi: {seed_meta.get('source', '?')} — oneriler ayni kaynaktan.")
    print("=" * 60)


if __name__ == "__main__":
    main()
