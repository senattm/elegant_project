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
