import { useAtom } from "jotai";
import { tokenAtom } from "../atoms";
import { useNotification } from "./useNotification";
import { ordersApi } from "../../api/client";
import type { CartItem } from "../../types";

interface PaymentData {
  cardNumber: string;
  cardHolderName: string;
  expiryDate: string;
  cvv: string;
}

export const useOrders = () => {
  const [token] = useAtom(tokenAtom);
  const { addNotification } = useNotification();

  const createOrder = async (
    items: CartItem[],
    payment: PaymentData,
    addressId?: number
  ) => {
    if (!token) {
      addNotification("Sipariş oluşturmak için giriş yapın", "error");
      throw new Error("Token gerekli");
    }

    if (!items || items.length === 0) {
      addNotification("Sepetiniz boş", "error");
      throw new Error("Sepet boş");
    }

    try {
      const orderItems = items.map((item) => {
        const price = item.price !== undefined
          ? item.price
          : (typeof item.product.price === "string" ? parseFloat(item.product.price) : item.product.price);

        return {
          productId: item.product.id,
          quantity: item.quantity,
          variantId: item.variantId || undefined,
          selectedSize: item.selectedSize || undefined,
          price: price,
        };
      });

      const response = await ordersApi.create(
        orderItems,
        payment,
        addressId
      );
      addNotification("Siparişiniz oluşturuldu!", "success");
      return response.data;
    } catch (error: any) {
      console.error("Sipariş oluşturulamadı:", error);
      const errorMessage = Array.isArray(error.response?.data?.message)
        ? error.response.data.message[0]
        : error.response?.data?.message || "Sipariş oluşturulamadı";
      addNotification(errorMessage, "error");
      throw error;
    }
  };

  const getUserOrders = async () => {
    if (!token) {
      return [];
    }

    try {
      const response = await ordersApi.getAll();
      return response.data;
    } catch (error: any) {
      console.error("Siparişler yüklenemedi:", error);
      return [];
    }
  };

  const getOrderById = async (orderId: number) => {
    if (!token) {
      throw new Error("Token gerekli");
    }

    try {
      const response = await ordersApi.getById(orderId);
      return response.data;
    } catch (error: any) {
      console.error("Sipariş yüklenemedi:", error);
      throw error;
    }
  };

  return {
    createOrder,
    getUserOrders,
    getOrderById,
  };
};
