export interface User {
  id: number;
  name: string;
  email: string;
}

export interface ProductVariant {
  id: number;
  size: string | null;
  price: number;
  stock: number;
  sku?: string | null;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number | string;
  stock: number;
  category: string;
  category_id: number;
  parent_category_id?: number | null;
  source?: string | null;
  images: string[];
  variants?: ProductVariant[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string | null;
  variantId?: number | null;
  price?: number;
}

export interface OrderItem {
  id: number;
  productId: number;
  variantId?: number | null;
  productName: string;
  productImages: string[];
  selectedSize: string | null;
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

export interface AddressFormInput {
  title: string;
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  district: string;
}

export interface PaymentMethod {
  id: number;
  card_holder: string;
  card_last4: string;
  expiry_date: string | null;
  provider: string;
  created_at: string;
}

export interface PaymentMethodFormInput {
  cardNumber: string;
  cardHolderName: string;
  expiryDate: string;
}
