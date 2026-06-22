import type { Product } from "../types";

export const calculatePriceRange = (products: Product[]): [number, number] => {
    if (products.length === 0) {
        return [0, 5000];
    }

    const prices = products
        .map((p) => parseFloat(String(p.price)))
        .filter((p) => !isNaN(p));

    if (prices.length === 0) {
        return [0, 5000];
    }

    const minPrice = Math.floor(Math.min(...prices));
    const maxPrice = Math.ceil(Math.max(...prices));

    return [minPrice, maxPrice];
};

export const parsePrice = (price: number | string): number => {
    return parseFloat(String(price));
};
