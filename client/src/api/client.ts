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
    addressId?: number,
    token: string
  ) => api.post("/orders", { items, addressId }, getAuthHeader(token)),
  getAll: (token: string) => api.get("/orders", getAuthHeader(token)),
  getById: (orderId: number, token: string) =>
    api.get(`/orders/${orderId}`, getAuthHeader(token)),
};
