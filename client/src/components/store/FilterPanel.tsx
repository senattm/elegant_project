import {
    Box,
    Group,
    Text,
    UnstyledButton,
    Collapse,
    NumberInput,
    Select,
    Flex,
    Badge,
    Button,
} from "@mantine/core";
import { useState } from "react";
import { IconChevronDown, IconX } from "@tabler/icons-react";
import type { SortOption } from "../../hooks/useStoreFilters";

interface Category {
    name: string;
    product_count: number;
}

interface FilterPanelProps {
    categories: Category[];
    selectedCategories: string[];
    setSelectedCategories: (categories: string[]) => void;
    priceRange: [number, number];
    setPriceRange: (range: [number, number]) => void;
    maxPrice: number;
    sortBy: SortOption;
    setSortBy: (sort: SortOption) => void;
    hasActiveFilters: boolean;
    onClearFilters: () => void;
    productCount: number;
    searchQuery: string;
    onClearSearch: () => void;
}

const FilterPanel = ({
    categories,
    selectedCategories,
    setSelectedCategories,
    priceRange,
    setPriceRange,
    maxPrice,
    sortBy,
    setSortBy,
    hasActiveFilters,
    onClearFilters,
    productCount,
    searchQuery,
    onClearSearch,
}: FilterPanelProps) => {
    const [categoryOpen, setCategoryOpen] = useState(false);
    const [priceOpen, setPriceOpen] = useState(false);

    const toggleCategory = (categoryName: string) => {
        if (selectedCategories.includes(categoryName)) {
            setSelectedCategories(selectedCategories.filter((c) => c !== categoryName));
        } else {
            setSelectedCategories([...selectedCategories, categoryName]);
        }
    };

    return (
        <Box mb="xl">
            <Group justify="center" mb="lg">
                <Text fz="sm" c="dimmed" fw={500}>
                    {productCount} ÜRÜN
                    {hasActiveFilters && (
                        <Text component="span" c="dark" ml={8}>
                            • Filtrelenmiş
                        </Text>
                    )}
                </Text>
                {searchQuery && (
                    <Button
                        variant="subtle"
                        size="compact-xs"
                        onClick={onClearSearch}
                        leftSection={<IconX size={14} />}
                    >
                        Aramayı Temizle
                    </Button>
                )}
            </Group>
            <Flex
                justify="space-between"
                align="center"
                mb="md"
                pb="md"
                style={{ borderBottom: "2px solid black" }}
                wrap="wrap"
                gap="md"
            >
                <Group gap="md">
                    <UnstyledButton
                        onClick={() => setCategoryOpen(!categoryOpen)}
                        style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            letterSpacing: "0.1em",
                            padding: "8px 16px",
                            border: categoryOpen || selectedCategories.length > 0 ? "1px solid black" : "1px solid #dee2e6",
                            backgroundColor: categoryOpen || selectedCategories.length > 0 ? "black" : "transparent",
                            color: categoryOpen || selectedCategories.length > 0 ? "white" : "black",
                            transition: "all 0.2s ease",
                        }}
                    >
                        <Group gap={8}>
                            <span>{"Kategoriler".toLocaleUpperCase("tr-TR")}</span>
                            {selectedCategories.length > 0 && (
                                <Badge size="xs" variant="light" color="gray" radius={0}>
                                    {selectedCategories.length}
                                </Badge>
                            )}
                            <IconChevronDown
                                size={14}
                                style={{
                                    transform: categoryOpen ? "rotate(180deg)" : "rotate(0deg)",
                                    transition: "transform 0.2s ease",
                                }}
                            />
                        </Group>
                    </UnstyledButton>

                    <UnstyledButton
                        onClick={() => setPriceOpen(!priceOpen)}
                        style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            letterSpacing: "0.1em",
                            padding: "8px 16px",
                            border: priceOpen ? "1px solid black" : "1px solid #dee2e6",
                            backgroundColor: priceOpen ? "black" : "transparent",
                            color: priceOpen ? "white" : "black",
                            transition: "all 0.2s ease",
                        }}
                    >
                        <Group gap={8}>
                            <span>{"Fiyat".toLocaleUpperCase("tr-TR")}</span>
                            <IconChevronDown
                                size={14}
                                style={{
                                    transform: priceOpen ? "rotate(180deg)" : "rotate(0deg)",
                                    transition: "transform 0.2s ease",
                                }}
                            />
                        </Group>
                    </UnstyledButton>

                    {hasActiveFilters && (
                        <UnstyledButton
                            onClick={onClearFilters}
                            style={{
                                fontSize: "12px",
                                fontWeight: 600,
                                letterSpacing: "0.1em",
                                textDecoration: "underline",
                                textUnderlineOffset: "4px",
                            }}
                        >
                            {"Temizle".toLocaleUpperCase("tr-TR")}
                        </UnstyledButton>
                    )}
                </Group>

                <Select
                    value={sortBy}
                    onChange={(value) => setSortBy((value as SortOption) || "default")}
                    data={[
                        { value: "default", label: "Varsayılan" },
                        { value: "price-asc", label: "Fiyat: Düşük → Yüksek" },
                        { value: "price-desc", label: "Fiyat: Yüksek → Düşük" },
                        { value: "name-asc", label: "A → Z" },
                    ]}
                    size="sm"
                    w={200}
                    styles={{
                        input: {
                            border: "1px solid #dee2e6",
                            borderRadius: 0,
                            fontWeight: 500,
                            fontSize: "12px",
                            letterSpacing: "0.05em",
                            "&:focus": {
                                borderColor: "black",
                            },
                        },
                    }}
                />
            </Flex>

            <Box>
                <Collapse in={categoryOpen}>
                    <Box mb="md" p="md" style={{ border: "1px solid #e9ecef" }}>
                        <Group gap="xs">
                            {categories.map((category) => {
                                const isSelected = selectedCategories.includes(category.name);
                                return (
                                    <UnstyledButton
                                        key={category.name}
                                        onClick={() => toggleCategory(category.name)}
                                        style={{
                                            padding: "6px 12px",
                                            border: "1px solid black",
                                            backgroundColor: isSelected ? "black" : "transparent",
                                            color: isSelected ? "white" : "black",
                                            fontSize: "12px",
                                            fontWeight: isSelected ? 600 : 400,
                                            letterSpacing: "0.03em",
                                            transition: "all 0.2s ease",
                                        }}
                                    >
                                        {category.name} ({category.product_count})
                                    </UnstyledButton>
                                );
                            })}
                        </Group>
                    </Box>
                </Collapse>

                <Collapse in={priceOpen}>
                    <Box mb="md" p="md" style={{ border: "1px solid #e9ecef" }}>
                        <Group grow maw={400}>
                            <NumberInput
                                label="Min"
                                value={priceRange[0]}
                                onChange={(val) => setPriceRange([Number(val) || 0, priceRange[1]])}
                                min={0}
                                max={priceRange[1]}
                                suffix=" ₺"
                                size="sm"
                                styles={{
                                    input: {
                                        border: "1px solid #dee2e6",
                                        borderRadius: 0,
                                        fontWeight: 500,
                                        "&:focus": {
                                            borderColor: "black",
                                        },
                                    },
                                    label: {
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        letterSpacing: "0.05em",
                                        textTransform: "uppercase",
                                        marginBottom: 8,
                                    },
                                }}
                            />
                            <NumberInput
                                label="Max"
                                value={priceRange[1]}
                                onChange={(val) => setPriceRange([priceRange[0], Number(val) || maxPrice])}
                                min={priceRange[0]}
                                max={maxPrice}
                                suffix=" ₺"
                                size="sm"
                                styles={{
                                    input: {
                                        border: "1px solid #dee2e6",
                                        borderRadius: 0,
                                        fontWeight: 500,
                                        "&:focus": {
                                            borderColor: "black",
                                        },
                                    },
                                    label: {
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        letterSpacing: "0.05em",
                                        textTransform: "uppercase",
                                        marginBottom: 8,
                                    },
                                }}
                            />
                        </Group>
                    </Box>
                </Collapse>
            </Box>
        </Box>
    );
};

export default FilterPanel;
