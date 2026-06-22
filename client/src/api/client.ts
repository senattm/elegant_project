import axios from "axios";
import { getAuthToken } from "../utils/authToken";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const cartApi = {
  get: () => api.get("/cart"),
  add: (data: { productId: number; quantity: number; variantId?: number; selectedSize?: string }) =>
    api.post("/cart", data),
  remove: (productId: number, variantId?: number, selectedSize?: string) => {
    const config = {
      params: variantId ? { variantId } : selectedSize ? { selectedSize } : undefined,
    };
    return api.delete(`/cart/${productId}`, config);
  },
  update: (
    productId: number,
    data: { quantity: number; variantId?: number; selectedSize?: string }
  ) => api.put(`/cart/${productId}`, data),
  clear: () => api.delete("/cart"),
};

export const favoritesApi = {
  getAll: () => api.get("/favorites"),
  toggle: (productId: number) => api.post("/favorites/toggle", { productId }),
  remove: (productId: number) => api.delete(`/favorites/${productId}`),
  clear: () => api.delete("/favorites"),
};

export const productsApi = {
  getAll: () => api.get("/products"),
  getById: (id: number) => api.get(`/products/${id}`),
};

export const ordersApi = {
  create: (
    items: Array<{
      productId: number;
      quantity: number;
      variantId?: number;
      selectedSize?: string;
      price: number;
    }>,
    payment: {
      cardNumber: string;
      cardHolderName: string;
      expiryDate: string;
      cvv: string;
    },
    addressId?: number
  ) => api.post("/orders", { items, payment, addressId }),
  getAll: () => api.get("/orders"),
  getById: (orderId: number) => api.get(`/orders/${orderId}`),
  checkFirstOrder: () => api.get("/orders/check/first-order"),
};

export const authApi = {
  updateProfile: (data: { name: string }) => api.patch("/auth/profile", data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post("/auth/change-password", data),
};

export const addressesApi = {
  getAll: () => api.get("/addresses"),
  getById: (id: number) => api.get(`/addresses/${id}`),
  create: (data: {
    title?: string;
    fullName: string;
    phone: string;
    addressLine: string;
    city: string;
    district: string;
  }) => api.post("/addresses", data),
  update: (
    id: number,
    data: {
      title?: string;
      fullName?: string;
      phone?: string;
      addressLine?: string;
      city?: string;
      district?: string;
    }
  ) => api.patch(`/addresses/${id}`, data),
  delete: (id: number) => api.delete(`/addresses/${id}`),
};

export const paymentMethodsApi = {
  getAll: () => api.get("/payment-methods"),
  getById: (id: number) => api.get(`/payment-methods/${id}`),
  create: (data: {
    cardNumber: string;
    cardHolderName: string;
    expiryDate: string;
    provider?: string;
  }) => api.post("/payment-methods", data),
  delete: (id: number) => api.delete(`/payment-methods/${id}`),
};

export const chatbotApi = {
  sendMessage: (message: string) => api.post("/chatbot/message", { message }),
};

const PYTHON_URL =
  import.meta.env.VITE_PYTHON_URL || "http://127.0.0.1:8001";

const pythonHttp = axios.create({ baseURL: PYTHON_URL });

export const pythonApi = {
  getComplement: (productIds: number[], k = 8, category = "") =>
    pythonHttp.get<{
      items: Array<{
        id: number;
        name: string;
        category: string;
        image_url: string;
      }>;
      seed_ids: number[];
      engine: string;
    }>("/complement", {
      params: { product_ids: productIds.join(","), k, category },
      timeout: 120_000,
    }),
};