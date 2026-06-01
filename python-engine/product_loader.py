"""Urunleri veritabanindan yukler (brand/gender kolonu olmasa da calisir)."""

from __future__ import annotations

import os
from urllib.parse import urlparse

import pandas as pd
import psycopg2

from outfit_engine import prepare_products_dataframe


def _database_url() -> str:
    database_url = os.environ.get(
        "DATABASE_URL", "postgresql://postgres:123456@localhost:5432/elegant_db"
    )
    parsed = urlparse(database_url)
    if parsed.query:
        return database_url.split("?")[0]
    return database_url


def load_products(*, include_updated_at: bool = False, include_image: bool = False) -> pd.DataFrame:
    columns = "id, name, description, colors, season, tags"
    if include_updated_at:
        columns += ", updated_at"

    conn = psycopg2.connect(_database_url())
    raw_df = pd.read_sql(f"SELECT {columns} FROM products", conn)

    if include_image:
        images_df = pd.read_sql(
            """
            SELECT DISTINCT ON (product_id) product_id AS id, image_url
            FROM product_images
            ORDER BY product_id,
              CASE WHEN image_url ~ '-1\\.(jpe?g|png|webp)$' THEN 0 ELSE 1 END,
              is_main DESC NULLS LAST,
              id ASC
            """,
            conn,
        )
        raw_df = raw_df.merge(images_df, on="id", how="left")

    conn.close()

    raw_df["brand"] = None
    raw_df["gender"] = None
    return prepare_products_dataframe(raw_df)
