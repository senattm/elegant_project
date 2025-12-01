
export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number | string;
  stock?: number;
  images: string[];
  category?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
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
  product: Product;
  quantity: number;
  selectedSize?: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  items: CartItem[];
  totalAmount: number;
  status: string;
  createdAt: string;
}
