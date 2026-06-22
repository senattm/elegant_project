"""
Stil kümeleme: CLIP embeddinglerini K-means ile gruplara ayırır.

Her ürün bir "stil kümesine" atanır. CIR önerileri sadece seed'in
kümesiyle aynı veya yakın kümelerden seçilir → spor şort ≠ glitter ayakkabı.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np

ENGINE_DIR = Path(__file__).resolve().parent
CLUSTER_PATH = ENGINE_DIR / "data" / "style_clusters.json"

# Küme sayısı: 1821 ürün / 12 ≈ 152 ürün/küme
# Her kümede tüm kategorilerden ürünler bulunacak şekilde yeterince büyük
N_CLUSTERS = 8   # geniş kümeler → fallback daha az, stil tutarlılığı yüksek

_cluster_cache: dict | None = None


def build_clusters(ids: list[int], clip_embs: np.ndarray, *, force: bool = False) -> dict[int, int]:
    """
    CLIP embeddinglerinden K-means kümeleri oluşturur.

    ids        : ürün ID listesi (N,)
    clip_embs  : CLIP embeddingleri (N, D)
    Returns    : {product_id: cluster_id}
    """
    global _cluster_cache

    if not force and CLUSTER_PATH.is_file():
        raw = json.loads(CLUSTER_PATH.read_text())
        _cluster_cache = {int(k): int(v) for k, v in raw.items()}
        print(f"[Style] Stil kümeleri yüklendi: {len(_cluster_cache)} ürün, {N_CLUSTERS} küme")
        return _cluster_cache

    from sklearn.cluster import MiniBatchKMeans
    from sklearn.preprocessing import normalize

    print(f"[Style] {len(ids)} ürün için {N_CLUSTERS} stil kümesi hesaplanıyor…")

    # L2 normalize — kosinüs benzerliği için
    embs_norm = normalize(clip_embs.astype(np.float32))

    kmeans = MiniBatchKMeans(
        n_clusters=N_CLUSTERS,
        random_state=42,
        batch_size=256,
        n_init=5,
        max_iter=300,
    )
    labels = kmeans.fit_predict(embs_norm)

    id_to_cluster: dict[int, int] = {int(pid): int(lbl) for pid, lbl in zip(ids, labels)}

    CLUSTER_PATH.parent.mkdir(parents=True, exist_ok=True)
    CLUSTER_PATH.write_text(json.dumps(id_to_cluster))

    _cluster_cache = id_to_cluster
    print(f"[Style] Kaydedildi. Küme boyutları: { {c: list(labels).count(c) for c in range(N_CLUSTERS)} }")
    return _cluster_cache


def get_clusters(ids: list[int], clip_embs: np.ndarray) -> dict[int, int]:
    """Cache'den veya diskten küme atamasını döndürür."""
    global _cluster_cache
    if _cluster_cache is not None and len(_cluster_cache) >= len(ids) * 0.9:
        return _cluster_cache
    return build_clusters(ids, clip_embs)


def nearest_clusters(seed_cluster: int, clip_embs: np.ndarray, ids: list[int], n: int = 2) -> set[int]:
    """
    Seed kümesine en yakın n kümeyi döndürür (centroid uzaklığına göre).
    Kümeler arası yakınlık için her kümenin merkezi hesaplanır.
    """
    global _cluster_cache
    if _cluster_cache is None:
        return {seed_cluster}

    from sklearn.preprocessing import normalize
    embs_norm = normalize(clip_embs.astype(np.float32))
    labels = np.array([_cluster_cache.get(pid, -1) for pid in ids])

    centroids: dict[int, np.ndarray] = {}
    for c in set(_cluster_cache.values()):
        mask = labels == c
        if mask.sum() > 0:
            centroids[c] = embs_norm[mask].mean(axis=0)

    if seed_cluster not in centroids:
        return {seed_cluster}

    seed_centroid = centroids[seed_cluster]
    distances = {
        c: float(np.linalg.norm(seed_centroid - centroids[c]))
        for c in centroids if c != seed_cluster
    }
    nearest = sorted(distances, key=distances.get)[:n]
    return {seed_cluster} | set(nearest)


def allowed_clusters(seed_cluster: int, *, tolerance: int = 0) -> set[int]:
    """Sadece seed kümesini döndürür (nearest_clusters ile genişletilebilir)."""
    return {seed_cluster}
