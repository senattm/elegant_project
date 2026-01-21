import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const tokenString = localStorage.getItem("token");
    if (tokenString) {
      try {
        const token = JSON.parse(tokenString);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error("Error parsing token:", error);
      }
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
  getByCategory: (categoryName: string) =>
    api.get(`/products/category/${categoryName}`),
  getCategories: () => api.get("/products/categories"),
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