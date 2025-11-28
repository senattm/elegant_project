import { useAtom } from "jotai";
import { cartAtom, cartCountAtom } from "../atoms";
import type { CartItem, Product } from "../atoms";
import { useNotification } from "./useNotification";

export const useCart = () => {
  const [cart, setCart] = useAtom(cartAtom);
  const [cartCount] = useAtom(cartCountAtom);
  const { addNotification } = useNotification();

  const addToCart = (product: Product, quantity: number = 1, size?: string) => {
    setCart((prev) => {
      const existingItem = prev.find(
        (item) =>
          item.product.id === product.id && item.selectedSize === size
      );

      if (existingItem) {
        return prev.map((item) =>
          item.product.id === product.id && item.selectedSize === size
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...prev, { product, quantity, selectedSize: size }];
    });

    addNotification("Ürün sepete eklendi!", "success");
  };

  const removeFromCart = (productId: number, size?: string) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(item.product.id === productId && item.selectedSize === size)
      )
    );
    addNotification("Ürün sepetten çıkarıldı", "info");
  };

  const updateQuantity = (productId: number, quantity: number, size?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, size);
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId && item.selectedSize === size
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    addNotification("Sepet temizlendi", "info");
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

  return {
    cart,
    cartCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
  };
};

