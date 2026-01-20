import { useState, useMemo } from "react";
import type { Product } from "../types";
import { parsePrice } from "../utils/priceUtils";

export type SortOption = "default" | "price-asc" | "price-desc" | "name-asc";

interface UseStoreFiltersProps {
    products: Product[];
    searchQuery: string;
}

export const useStoreFilters = ({ products, searchQuery }: UseStoreFiltersProps) => {
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
    const [sortBy, setSortBy] = useState<SortOption>("default");

    const filteredAndSortedProducts = useMemo(() => {
        let filtered = [...products];

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (product) =>
                    product.name.toLowerCase().includes(query) ||
                    (product.category && product.category.toLowerCase().includes(query)) ||
                    (product.description && product.description.toLowerCase().includes(query))
            );
        }

        if (selectedCategories.length > 0) {
            filtered = filtered.filter(
                (product) => product.category && selectedCategories.includes(product.category)
            );
        }

        filtered = filtered.filter((product) => {
            const price = parsePrice(product.price);
            return price >= priceRange[0] && price <= priceRange[1];
        });

        switch (sortBy) {
            case "price-asc":
                filtered.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
                break;
            case "price-desc":
                filtered.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
                break;
            case "name-asc":
                filtered.sort((a, b) => a.name.localeCompare(b.name, "tr"));
                break;
            default:
                break;
        }

        return filtered;
    }, [products, selectedCategories, priceRange, sortBy, searchQuery]);

    return {
        selectedCategories,
        setSelectedCategories,
        priceRange,
        setPriceRange,
        sortBy,
        setSortBy,
        filteredAndSortedProducts,
    };
};
