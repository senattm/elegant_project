import { useAtom } from "jotai";
import { cartAtom, cartCountAtom, tokenAtom } from "../atoms";
import { useNotification } from "./useNotification";
import type { Product } from "../../types";
import { cartApi } from "../../api/client";

export const useCart = () => {
  const [cart, setCart] = useAtom(cartAtom);
  const [cartCount] = useAtom(cartCountAtom);
  const [token] = useAtom(tokenAtom);
  const { addNotification } = useNotification();

  const fetchCart = async () => {
    if (!token) {
      setCart([]);
      return;
    }

    try {
      const response = await cartApi.get();
      const cartItems = response.data.map((item: any) => ({
        product: {
          id: item.product_id,
          name: item.name,
          price: item.price,
          description: item.description,
          stock: item.stock,
          images: item.images,
          category: item.category,
        },
        quantity: item.quantity,
        selectedSize: item.selected_size,
      }));
      setCart(cartItems);
    } catch (error: any) {
      console.error("Sepet yüklenemedi:", error);
      if (error.response?.status === 401) {
        addNotification("Lütfen giriş yapın", "error");
      }
    }
  };

  const addToCart = async (
    product: Product,
    quantity: number = 1,
    size?: string
  ) => {
    if (!token) {
      addNotification("Sepete eklemek için giriş yapın", "error");
      return;
    }

    try {
      await cartApi.add({ productId: product.id, quantity, selectedSize: size });
      addNotification("Ürün sepete eklendi!", "success");
      await fetchCart();
    } catch (error: any) {
      console.error("Sepete eklenemedi:", error);
      addNotification(
        error.response?.data?.message || "Sepete eklenemedi",
        "error"
      );
    }
  };

  const removeFromCart = async (productId: number, selectedSize?: string) => {
    if (!token) return;

    try {
      await cartApi.remove(productId, selectedSize);
      addNotification("Ürün sepetten çıkarıldı", "info");
      await fetchCart();
    } catch (error: any) {
      console.error("Sepetten çıkarılamadı:", error);
      addNotification(
        error.response?.data?.message || "Sepetten çıkarılamadı",
        "error"
      );
    }
  };

  const updateQuantity = async (
    productId: number,
    quantity: number,
    selectedSize?: string
  ) => {
    if (!token) return;

    try {
      await cartApi.update(productId, { quantity, selectedSize });
      await fetchCart();
    } catch (error: any) {
      console.error("Miktar güncellenemedi:", error);
      addNotification(
        error.response?.data?.message || "Miktar güncellenemedi",
        "error"
      );
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      const price =
        typeof item.product.price === "string"
          ? parseFloat(item.product.price)
          : item.product.price;
      return total + price * item.quantity;
    }, 0);
  };

  const clearCart = async () => {
    if (!token) return;

    try {
      await cartApi.clear();
      setCart([]);
    } catch (error: any) {
      console.error("Sepet temizlenemedi:", error);
      addNotification(
        error.response?.data?.message || "Sepet temizlenemedi",
        "error"
      );
    }
  };

  return {
    cart,
    cartCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    getTotalPrice,
    clearCart,
    fetchCart,
  };
};
