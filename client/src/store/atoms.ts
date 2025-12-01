import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { User, Product, CartItem } from "../types";

export type { User, Product, CartItem };

export const userAtom = atomWithStorage<User | null>("user", null);
export const tokenAtom = atomWithStorage<string | null>("token", null);
export const isAuthenticatedAtom = atom((get) => !!get(userAtom));

export const productsAtom = atom<Product[]>([]);
export const loadingProductsAtom = atom<boolean>(false);

export const cartAtom = atomWithStorage<CartItem[]>("cart", []);
export const cartCountAtom = atom((get) =>
  get(cartAtom).reduce((sum, item) => sum + item.quantity, 0)
);

export const favoritesAtom = atomWithStorage<number[]>("favorites", []);
