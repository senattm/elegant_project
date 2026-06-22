import { useCallback } from "react";
import { useAtom } from "jotai";
import { tokenAtom } from "../atoms";
import { useNotification } from "./useNotification";
import { ordersApi } from "../../api/client";
import { getAuthToken } from "../../utils/authToken";
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

  const createOrder = useCallback(async (
    items: CartItem[],
    payment: PaymentData,
    addressId?: number
  ) => {
    if (!getAuthToken()) {
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
  }, [addNotification]);

  const getUserOrders = useCallback(async () => {
    if (!getAuthToken()) {
      return [];
    }

    const response = await ordersApi.getAll();
    return response.data;
  }, [token]);

  const getOrderById = useCallback(async (orderId: number) => {
    if (!getAuthToken()) {
      throw new Error("Token gerekli");
    }

    const response = await ordersApi.getById(orderId);
    return response.data;
  }, [token]);

  return {
    createOrder,
    getUserOrders,
    getOrderById,
  };
};
