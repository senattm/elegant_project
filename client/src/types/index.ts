export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number | string;
  stock?: number;
  category?: string;
  images: string[];
}

export interface User {
  id?: number;
  name?: string;
  email?: string;
  isAuthenticated: boolean;
  addresses?: Address[];
}

export interface Address {
  id: string;
  title: string;
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  district: string;
  isDefault: boolean;
}

export interface CartItem {
  id: number;
  product: Product;
  quantity: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  items: CartItem[];
  totalAmount: number;
  status: string;
  createdAt: string;
}
