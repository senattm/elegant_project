import { useAtom } from "jotai";
import { cartAtom, cartCountAtom, tokenAtom } from "../atoms";
import { useNotification } from "./useNotification";
import type { Product } from "../../types";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const useCart = () => {
  const [cart, setCart] = useAtom(cartAtom);
  const [cartCount] = useAtom(cartCountAtom);
  const [token] = useAtom(tokenAtom);
  const { addNotification } = useNotification();

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${token}` },
  });

  const fetchCart = async () => {
    if (!token) {
      setCart([]);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/cart`, getAuthHeader());
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
        selectedSize: "M",
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
      await axios.post(
        `${API_URL}/cart`,
        { productId: product.id, quantity },
        getAuthHeader()
      );
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
      const url = selectedSize
        ? `${API_URL}/cart/${productId}?selectedSize=${selectedSize}`
        : `${API_URL}/cart/${productId}`;

      await axios.delete(url, getAuthHeader());
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
      await axios.put(
        `${API_URL}/cart/${productId}`,
        { quantity, selectedSize },
        getAuthHeader()
      );
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
      await axios.delete(`${API_URL}/cart`, getAuthHeader());
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
