import { useAtom } from "jotai";
import { favoritesAtom } from "../atoms";
import { useNotification } from "./useNotification";

export const useFavorites = () => {
  const [favorites, setFavorites] = useAtom(favoritesAtom);
  const { addNotification } = useNotification();

  const toggleFavorite = (productId: number) => {
    setFavorites((prev) => {
      const isFavorite = prev.includes(productId);

      if (isFavorite) {
        addNotification("Favorilerden çıkarıldı", "info");
        return prev.filter((id) => id !== productId);
      } else {
        addNotification("Favorilere eklendi!", "success");
        return [...prev, productId];
      }
    });
  };

  const isFavorite = (productId: number) => {
    return favorites.includes(productId);
  };

  const clearFavorites = () => {
    setFavorites([]);
    addNotification("Tüm favoriler temizlendi", "info");
  };

  return {
    favorites,
    toggleFavorite,
    isFavorite,
    clearFavorites,
  };
};

