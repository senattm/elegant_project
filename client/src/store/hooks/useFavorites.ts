import { useAtom } from "jotai";
import { favoritesAtom, tokenAtom } from "../atoms";
import { useNotification } from "./useNotification";
import { favoritesApi } from "../../api/client";

export const useFavorites = () => {
  const [favorites, setFavorites] = useAtom(favoritesAtom);
  const [token] = useAtom(tokenAtom);
  const { addNotification } = useNotification();

  const fetchFavorites = async () => {
    if (!token) {
      setFavorites([]);
      return;
    }

    try {
      const response = await favoritesApi.getAll();
      const favoriteIds = response.data.map((item: any) => item.product_id);
      setFavorites(favoriteIds);
    } catch (error: any) {
      console.error("Favoriler yüklenemedi:", error);
      if (error.response?.status === 401) {
        addNotification("Lütfen giriş yapın", "error");
      }
    }
  };

  const toggleFavorite = async (productId: number) => {
    if (!token) {
      addNotification("Favorilere eklemek için giriş yapın", "error");
      return;
    }

    try {
      const response = await favoritesApi.toggle(productId);

      if (response.data.isFavorite) {
        addNotification("Favorilere eklendi!", "success");
      } else {
        addNotification("Favorilerden çıkarıldı", "info");
      }

      await fetchFavorites();
    } catch (error: any) {
      console.error("Favori işlemi başarısız:", error);
      addNotification(
        error.response?.data?.message || "İşlem başarısız",
        "error"
      );
    }
  };

  const isFavorite = (productId: number) => {
    return favorites.includes(productId);
  };

  const removeFavorite = async (productId: number) => {
    if (!token) return;

    try {
      await favoritesApi.remove(productId);
      addNotification("Favorilerden çıkarıldı", "info");
      await fetchFavorites();
    } catch (error: any) {
      console.error("Favorilerden çıkarılamadı:", error);
      addNotification(
        error.response?.data?.message || "Favorilerden çıkarılamadı",
        "error"
      );
    }
  };

  const clearFavorites = async () => {
    if (!token) return;

    try {
      await favoritesApi.clear();
      addNotification("Tüm favoriler temizlendi", "info");
      setFavorites([]);
    } catch (error: any) {
      console.error("Favoriler temizlenemedi:", error);
      addNotification(
        error.response?.data?.message || "Favoriler temizlenemedi",
        "error"
      );
    }
  };

  return {
    favorites,
    toggleFavorite,
    isFavorite,
    removeFavorite,
    clearFavorites,
    fetchFavorites,
  };
};
