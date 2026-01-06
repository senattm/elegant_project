export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number | string;
  stock: number;
  category: string;
  category_id: number;
  images: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productImages: string[];
  selectedSize: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  status: string;
  createdAt: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  items: OrderItem[];
}
export interface JwtPayload {
  id: number;
  email: string;
}

export interface Address {
  id: number;
  title?: string;
  full_name: string;
  phone: string;
  address_line: string;
  city: string;
  district: string;
  created_at: string;
}
