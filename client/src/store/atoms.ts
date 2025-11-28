import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number | string;
  stock?: number;
  images: string[];
  category?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
}

export interface Notification {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

export const userAtom = atomWithStorage<User | null>("user", null);
export const tokenAtom = atomWithStorage<string | null>("token", null);
export const isAuthenticatedAtom = atom((get) => !!get(userAtom));

export const productsAtom = atom<Product[]>([]);
export const loadingProductsAtom = atom<boolean>(false);

export const cartAtom = atomWithStorage<CartItem[]>("cart", []);
export const cartCountAtom = atom((get) => 
  get(cartAtom).reduce((sum, item) => sum + item.quantity, 0)
);

export const notificationsAtom = atom<Notification[]>([]);

export const favoritesAtom = atomWithStorage<number[]>("favorites", []);

