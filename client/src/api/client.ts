import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const getAuthHeader = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const cartApi = {
  get: (token: string) => api.get("/cart", getAuthHeader(token)),
  add: (
    data: { productId: number; quantity: number; selectedSize?: string },
    token: string
  ) => api.post("/cart", data, getAuthHeader(token)),
  remove: (
    productId: number,
    selectedSize: string | undefined,
    token: string
  ) => {
    const config = {
      ...getAuthHeader(token),
      params: selectedSize ? { selectedSize } : undefined,
    };
    return api.delete(`/cart/${productId}`, config);
  },
  update: (
    productId: number,
    data: { quantity: number; selectedSize?: string },
    token: string
  ) => api.put(`/cart/${productId}`, data, getAuthHeader(token)),
  clear: (token: string) => api.delete("/cart", getAuthHeader(token)),
};

export const favoritesApi = {
  getAll: (token: string) => api.get("/favorites", getAuthHeader(token)),
  toggle: (productId: number, token: string) =>
    api.post("/favorites/toggle", { productId }, getAuthHeader(token)),
  remove: (productId: number, token: string) =>
    api.delete(`/favorites/${productId}`, getAuthHeader(token)),
  clear: (token: string) => api.delete("/favorites", getAuthHeader(token)),
};

export const productsApi = {
  getAll: () => api.get("/products"),
  getById: (id: number) => api.get(`/products/${id}`),
  getByCategory: (categoryName: string) =>
    api.get(`/products/category/${categoryName}`),
  getCategories: () => api.get("/products/categories"),
};

export const ordersApi = {
  create: (
    items: Array<{
      productId: number;
      quantity: number;
      selectedSize?: string;
      price: number;
    }>,
    payment: {
      cardNumber: string;
      cardHolderName: string;
      expiryDate: string;
      cvv: string;
    },
    token: string,
    addressId?: number
  ) => api.post("/orders", { items, payment, addressId }, getAuthHeader(token)),
  getAll: (token: string) => api.get("/orders", getAuthHeader(token)),
  getById: (orderId: number, token: string) =>
    api.get(`/orders/${orderId}`, getAuthHeader(token)),
  checkFirstOrder: (token: string) =>
    api.get("/orders/check/first-order", getAuthHeader(token)),
};

export const authApi = {
  updateProfile: (data: { name: string }, token: string) =>
    api.patch("/auth/profile", data, getAuthHeader(token)),
  changePassword: (
    data: { currentPassword: string; newPassword: string },
    token: string
  ) => api.post("/auth/change-password", data, getAuthHeader(token)),
};

export const addressesApi = {
  getAll: (token: string) => api.get("/addresses", getAuthHeader(token)),
  getById: (id: number, token: string) =>
    api.get(`/addresses/${id}`, getAuthHeader(token)),
  create: (
    data: {
      title?: string;
      fullName: string;
      phone: string;
      addressLine: string;
      city: string;
      district: string;
    },
    token: string
  ) => api.post("/addresses", data, getAuthHeader(token)),
  update: (
    id: number,
    data: {
      title?: string;
      fullName?: string;
      phone?: string;
      addressLine?: string;
      city?: string;
      district?: string;
    },
    token: string
  ) => api.patch(`/addresses/${id}`, data, getAuthHeader(token)),
  delete: (id: number, token: string) =>
    api.delete(`/addresses/${id}`, getAuthHeader(token)),
};

export const paymentMethodsApi = {
  getAll: (token: string) => api.get("/payment-methods", getAuthHeader(token)),
  getById: (id: number, token: string) =>
    api.get(`/payment-methods/${id}`, getAuthHeader(token)),
  create: (
    data: {
      cardNumber: string;
      cardHolderName: string;
      expiryDate: string;
      provider?: string;
    },
    token: string
  ) => api.post("/payment-methods", data, getAuthHeader(token)),
  delete: (id: number, token: string) =>
    api.delete(`/payment-methods/${id}`, getAuthHeader(token)),
};