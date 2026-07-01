import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Box, SimpleGrid, Pagination, Center, Group, NumberInput, Text, Button } from "@mantine/core";
import ProductCard from "../components/features/ProductCard";
import FilterPanel from "../components/store/FilterPanel";
import { useProducts } from "../store/hooks";
import { productsApi } from "../api/client";
import { useAtom } from "jotai";
import { searchQueryAtom } from "../store/atoms";
import PageLayout from "../components/layout/PageLayout";
import LoadingState from "../components/ui/LoadingState";
import EmptyState from "../components/ui/EmptyState";
import { useStoreFilters } from "../hooks/useStoreFilters";
import { calculatePriceRange } from "../utils/priceUtils";
import { categoriesFromProducts } from "../utils/categoryUtils";

interface Category {
  name: string;
  product_count: number;
}

const PRODUCTS_PER_PAGE = 25;

const Store = () => {
  const { products, loading, fetchProducts } = useProducts();
  const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom);
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [currentPage, setCurrentPage] = useState(1);

  const {
    selectedCategories,
    setSelectedCategories,
    priceRange,
    setPriceRange,
    sortBy,
    setSortBy,
    filteredAndSortedProducts,
  } = useStoreFilters({ products, searchQuery });

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategories, priceRange, sortBy, searchQuery]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    const categoryFromUrl = searchParams.get("category");

    if (categoryFromUrl) {
      const decodedCategory = decodeURIComponent(categoryFromUrl);
      setSelectedCategories([decodedCategory]);
      setSearchQuery("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [searchParams]);

  const fetchCategories = async () => {
    try {
      const response = await productsApi.getAll();
      setCategories(categoriesFromProducts(response.data));

      if (response.data.length > 0) {
        const [min, max] = calculatePriceRange(response.data);
        setMaxPrice(max);
        setPriceRange([min, max]);
      }

      const categoryFromUrl = searchParams.get("category");
      if (categoryFromUrl) {
        const decodedCategory = decodeURIComponent(categoryFromUrl);
        setSelectedCategories([decodedCategory]);
        setSearchQuery("");
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    const [min, max] = calculatePriceRange(products);
    setPriceRange([min, max]);
    setSortBy("default");
  };

  const initialPriceRange = useMemo(() => {
    return calculatePriceRange(products);
  }, [products]);

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    sortBy !== "default" ||
    priceRange[0] !== initialPriceRange[0] ||
    priceRange[1] !== initialPriceRange[1];

  const totalPages = Math.ceil(filteredAndSortedProducts.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  const paginatedProducts = filteredAndSortedProducts.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const [goToPageValue, setGoToPageValue] = useState<number | string>("");

  const handleGoToPage = () => {
    const page = Number(goToPageValue);
    if (page >= 1 && page <= totalPages) {
      handlePageChange(page);
    }
    setGoToPageValue("");
  };

  if (loading) {
    return <LoadingState message="Ürünler yükleniyor..." />;
  }

  return (
    <PageLayout>
      <FilterPanel
        categories={categories}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        maxPrice={maxPrice}
        sortBy={sortBy}
        setSortBy={setSortBy}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        productCount={filteredAndSortedProducts.length}
        searchQuery={searchQuery}
        onClearSearch={() => setSearchQuery("")}
      />

      {filteredAndSortedProducts.length === 0 ? (
        <EmptyState message="Ürün bulunamadı" />
      ) : (
        <>
          <Box mb={40}>
            <SimpleGrid
              cols={{ base: 2, xs: 2, sm: 3, md: 4, lg: 5 }}
              spacing={{ base: "md", sm: "lg" }}
            >
              {paginatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </SimpleGrid>
          </Box>

          {totalPages > 1 && (
            <Center mb={80}>
              <Group gap="xl" align="center" wrap="wrap" justify="center">
                <Pagination
                  total={totalPages}
                  value={currentPage}
                  onChange={handlePageChange}
                  size="lg"
                  radius={0}
                  siblings={2}
                  withEdges
                  color="dark"
                  styles={{
                    control: {
                      border: "none",
                      fontWeight: 500,
                      letterSpacing: "0.05em",
                      "&[data-active]": {
                        backgroundColor: "black",
                        color: "white",
                      },
                      "&:not([data-active]):hover": {
                        backgroundColor: "#f1f3f5",
                      },
                    },
                  }}
                />
                <Group gap="xs" align="center">
                  <Text size="sm" c="dimmed">Sayfaya git</Text>
                  <NumberInput
                    value={goToPageValue}
                    onChange={setGoToPageValue}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleGoToPage();
                    }}
                    min={1}
                    max={totalPages}
                    placeholder={`1-${totalPages}`}
                    w={90}
                    size="sm"
                    radius={0}
                    hideControls
                  />
                  <Button
                    onClick={handleGoToPage}
                    variant="outline"
                    color="dark"
                    radius={0}
                    size="sm"
                  >
                    Git
                  </Button>
                </Group>
              </Group>
            </Center>
          )}
        </>
      )}
    </PageLayout>
  );
};

export default Store;
