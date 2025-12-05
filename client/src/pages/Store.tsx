import { useEffect, useState, useMemo } from "react";
import {
  Container,
  Text,
  Box,
  SimpleGrid,
  Loader,
  Center,
  Group,
  Button,
  Select,
  NumberInput,
  Chip,
  Stack,
  Paper,
  Badge,
  ScrollArea,
  Flex,
  Title,
} from "@mantine/core";
import { IconFilter, IconX, IconChevronDown } from "@tabler/icons-react";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../store/hooks";
import { productsApi } from "../api/client";
import type { Product } from "../types";
type SortOption = "default" | "price-asc" | "price-desc" | "name-asc";
const Store = () => {
  const { products, loading, fetchProducts } = useProducts();
  const [categories, setCategories] = useState<
    Array<{ name: string; product_count: number }>
  >([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [showFilters, setShowFilters] = useState(false);
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);
  const fetchCategories = async () => {
    try {
      const response = await productsApi.getAll();
      const categoriesMap = new Map<string, number>();
      response.data.forEach((product: Product) => {
        if (product.category) {
          const count = categoriesMap.get(product.category) || 0;
          categoriesMap.set(product.category, count + 1);
        }
      });
      const categoriesArray = Array.from(categoriesMap.entries()).map(
        ([name, product_count]) => ({ name, product_count })
      );
      setCategories(categoriesArray);
      if (response.data.length > 0) {
        const prices = response.data
          .map((p: Product) => parseFloat(String(p.price)))
          .filter((p: number) => !isNaN(p));
        if (prices.length > 0) {
          const minPrice = Math.floor(Math.min(...prices));
          const calculatedMaxPrice = Math.ceil(Math.max(...prices));
          setMaxPrice(calculatedMaxPrice);
          setPriceRange([minPrice, calculatedMaxPrice]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(
        (product) =>
          product.category && selectedCategories.includes(product.category)
      );
    }
    filtered = filtered.filter((product) => {
      const price = parseFloat(String(product.price));
      return price >= priceRange[0] && price <= priceRange[1];
    });
    switch (sortBy) {
      case "price-asc":
        filtered.sort((a, b) => {
          const priceA = parseFloat(String(a.price));
          const priceB = parseFloat(String(b.price));
          return priceA - priceB;
        });
        break;
      case "price-desc":
        filtered.sort((a, b) => {
          const priceA = parseFloat(String(a.price));
          const priceB = parseFloat(String(b.price));
          return priceB - priceA;
        });
        break;
      case "name-asc":
        filtered.sort((a, b) => a.name.localeCompare(b.name, "tr"));
        break;
      default:
        break;
    }
    return filtered;
  }, [products, selectedCategories, priceRange, sortBy]);
  const clearFilters = () => {
    setSelectedCategories([]);
    if (products.length > 0) {
      const prices = products
        .map((p) => parseFloat(String(p.price)))
        .filter((p) => !isNaN(p));
      if (prices.length > 0) {
        const minPrice = Math.floor(Math.min(...prices));
        const calculatedMaxPrice = Math.ceil(Math.max(...prices));
        setPriceRange([minPrice, calculatedMaxPrice]);
      }
    } else {
      setPriceRange([0, maxPrice]);
    }
    setSortBy("default");
  };
  const initialPriceRange = useMemo(() => {
    if (products.length > 0) {
      const prices = products
        .map((p) => parseFloat(String(p.price)))
        .filter((p) => !isNaN(p));
      if (prices.length > 0) {
        const minPrice = Math.floor(Math.min(...prices));
        const calculatedMaxPrice = Math.ceil(Math.max(...prices));
        return [minPrice, calculatedMaxPrice] as [number, number];
      }
    }
    return [0, maxPrice] as [number, number];
  }, [products, maxPrice]);
  const hasActiveFilters =
    selectedCategories.length > 0 ||
    sortBy !== "default" ||
    priceRange[0] !== initialPriceRange[0] ||
    priceRange[1] !== initialPriceRange[1];
  const titleStyle = {
    fontWeight: 300,
    letterSpacing: "0.1em",
    fontFamily: "Playfair Display, serif",
  };
  return (
    <Box mih="100vh" pt={{ base: 250, sm: 180, md: 140 }} pb={80}>
      {" "}
      <Container size="xl">
        {" "}
        <Box mb={60} ta="center">
          {" "}
          <Title
            order={1}
            fz={{ base: 32, sm: 40, md: 48 }}
            style={titleStyle}
            mb={12}
          >
            {" "}
            MAĞAZA{" "}
          </Title>{" "}
          <Text fz="sm" c="dimmed" fw={500}>
            {" "}
            {filteredAndSortedProducts.length} ÜRÜN{" "}
            {hasActiveFilters && (
              <Text component="span" c="dark" ml={8}>
                {" "}
                • Filtrelenmiş{" "}
              </Text>
            )}{" "}
          </Text>{" "}
        </Box>{" "}
        <Paper
          p={{ base: "md", sm: "lg" }}
          mb="xl"
          withBorder
          style={{ borderColor: "#e9ecef", backgroundColor: "#fafafa" }}
        >
          {" "}
          <Flex
            direction={{ base: "column", sm: "row" }}
            justify="space-between"
            align={{ base: "stretch", sm: "center" }}
            gap="md"
            wrap="wrap"
          >
            {" "}
            <Group gap="sm" wrap="wrap">
              {" "}
              <Button
                variant={showFilters ? "filled" : "light"}
                color="dark"
                leftSection={<IconFilter size={18} />}
                rightSection={
                  <IconChevronDown
                    size={16}
                    style={{
                      transform: showFilters
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                    }}
                  />
                }
                onClick={() => setShowFilters(!showFilters)}
                style={{ fontWeight: 500, letterSpacing: "0.05em" }}
              >
                {" "}
                Filtreler{" "}
              </Button>{" "}
              {hasActiveFilters && (
                <Button
                  variant="subtle"
                  color="gray"
                  leftSection={<IconX size={16} />}
                  onClick={clearFilters}
                  size="sm"
                  style={{ fontWeight: 500 }}
                >
                  {" "}
                  Temizle{" "}
                </Button>
              )}{" "}
            </Group>{" "}
            <Select
              label="Sırala"
              placeholder="Sıralama seçin"
              value={sortBy}
              onChange={(value) =>
                setSortBy((value as SortOption) || "default")
              }
              data={[
                { value: "default", label: "Varsayılan" },
                { value: "price-asc", label: "Fiyat: Düşükten Yükseğe" },
                { value: "price-desc", label: "Fiyat: Yüksekten Düşüğe" },
                { value: "name-asc", label: "İsme Göre (A-Z)" },
              ]}
              style={{ minWidth: 220 }}
              styles={{
                label: {
                  fontWeight: 600,
                  fontSize: "12px",
                  letterSpacing: "0.05em",
                  marginBottom: 8,
                },
              }}
            />{" "}
          </Flex>{" "}
          {showFilters && (
            <Box
              mt="xl"
              pt="xl"
              style={{
                borderTop: "1px solid #e9ecef",
                animation: "fadeIn 0.3s ease",
              }}
            >
              {" "}
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                {" "}
                <Stack gap="md">
                  {" "}
                  <Text fw={600} size="sm" c="dark">
                    {" "}
                    Kategoriler{" "}
                  </Text>{" "}
                  <ScrollArea h={220}>
                    {" "}
                    <Chip.Group
                      multiple
                      value={selectedCategories}
                      onChange={setSelectedCategories}
                    >
                      {" "}
                      <Stack gap="xs">
                        {" "}
                        {categories.map((category) => (
                          <Group
                            key={category.name}
                            justify="space-between"
                            p="xs"
                            style={{
                              borderRadius: "6px",
                              transition: "background-color 0.2s",
                              cursor: "pointer",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#f8f9fa";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                "transparent";
                            }}
                          >
                            {" "}
                            <Chip
                              value={category.name}
                              size="sm"
                              styles={{
                                label: { fontWeight: 500, padding: "6px 12px" },
                              }}
                            >
                              {" "}
                              {category.name}{" "}
                            </Chip>{" "}
                            <Badge
                              size="sm"
                              variant="light"
                              color="gray"
                              style={{ fontWeight: 600 }}
                            >
                              {" "}
                              {category.product_count}{" "}
                            </Badge>{" "}
                          </Group>
                        ))}{" "}
                      </Stack>{" "}
                    </Chip.Group>{" "}
                  </ScrollArea>{" "}
                </Stack>{" "}
                <Stack gap="md">
                  {" "}
                  <Text fw={600} size="sm" c="dark">
                    {" "}
                    Fiyat Aralığı{" "}
                  </Text>{" "}
                  <Group gap="md" grow>
                    {" "}
                    <NumberInput
                      label="Minimum"
                      value={priceRange[0]}
                      onChange={(value) =>
                        setPriceRange([Number(value) || 0, priceRange[1]])
                      }
                      min={0}
                      max={maxPrice}
                      step={50}
                      suffix=" TL"
                      styles={{
                        label: {
                          fontWeight: 500,
                          fontSize: "12px",
                          marginBottom: 6,
                        },
                        input: { fontWeight: 500 },
                      }}
                    />{" "}
                    <NumberInput
                      label="Maksimum"
                      value={priceRange[1]}
                      onChange={(value) =>
                        setPriceRange([
                          priceRange[0],
                          Number(value) || maxPrice,
                        ])
                      }
                      min={0}
                      max={maxPrice}
                      step={50}
                      suffix=" TL"
                      styles={{
                        label: {
                          fontWeight: 500,
                          fontSize: "12px",
                          marginBottom: 6,
                        },
                        input: { fontWeight: 500 },
                      }}
                    />{" "}
                  </Group>{" "}
                </Stack>{" "}
              </SimpleGrid>{" "}
            </Box>
          )}{" "}
        </Paper>{" "}
        {loading && (
          <Center py={80}>
            {" "}
            <Stack gap="md" align="center">
              {" "}
              <Loader color="black" size="lg" />{" "}
              <Text c="dimmed" fw={500}>
                {" "}
                Ürünler yükleniyor...{" "}
              </Text>{" "}
            </Stack>{" "}
          </Center>
        )}{" "}
        {!loading && filteredAndSortedProducts.length === 0 && (
          <Center py={80}>
            {" "}
            <Stack gap="md" align="center">
              {" "}
              <Text c="dimmed" size="xl" fw={500}>
                {" "}
                Filtrelere uygun ürün bulunamadı{" "}
              </Text>{" "}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  color="dark"
                  onClick={clearFilters}
                  size="md"
                  style={{ fontWeight: 500, letterSpacing: "0.05em" }}
                >
                  {" "}
                  Filtreleri Temizle{" "}
                </Button>
              )}{" "}
            </Stack>{" "}
          </Center>
        )}{" "}
        {!loading && filteredAndSortedProducts.length > 0 && (
          <SimpleGrid
            cols={{ base: 1, xs: 2, sm: 2, md: 3, lg: 4 }}
            spacing={{ base: 24, sm: 28, md: 36 }}
          >
            {" "}
            {filteredAndSortedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}{" "}
          </SimpleGrid>
        )}{" "}
      </Container>{" "}
    </Box>
  );
};
export default Store;
