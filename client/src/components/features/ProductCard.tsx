import { useState, useMemo, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Text as MantineText,
  UnstyledButton,
  Button,
  Group,
  ActionIcon,
  rem,
} from "@mantine/core";
import { IconHeart, IconHeartFilled } from "@tabler/icons-react";
import { motion } from "framer-motion";
import { useFavorites, useCart } from "../../store/hooks";
import type { Product } from "../../store/atoms";
import ImageSlider from "../ui/ImageSlider";

interface ProductCardProps {
  product: Product;
}

const CATEGORY_SIZES: Record<number, string[]> = {
  7: ["36", "37", "38", "39", "40", "41"],
  8: ["STD"],
};

const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL"];

const ProductCard = ({ product }: ProductCardProps) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [hoveredSize, setHoveredSize] = useState<string | null>(null);

  const { isFavorite, toggleFavorite } = useFavorites();
  const { addToCart } = useCart();
  const isProductFavorite = isFavorite(product.id);

  const formattedPrice = useMemo(() => {
    const price =
      typeof product.price === "number"
        ? product.price
        : parseFloat(product.price);
    return price.toFixed(2);
  }, [product.price]);

  const availableSizes = CATEGORY_SIZES[product.category_id] || DEFAULT_SIZES;

  const handleAddToCart = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!selectedSize) return;
    addToCart(product, 1, selectedSize);
    setSelectedSize(null);
    setIsHovered(false);
  };

  return (
    <Box
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setSelectedSize(null);
        setHoveredSize(null);
      }}
      pos="relative"
    >
      <Box pos="relative" style={{ overflow: "hidden" }}>
        <ActionIcon
          radius="xl"
          size={40}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(product.id);
          }}
          pos="absolute"
          top={rem(12)}
          right={rem(12)}
          bg="white"
          style={{
            zIndex: 40,
            border: "none",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          {isProductFavorite ? (
            <IconHeartFilled size={22} color="red" />
          ) : (
            <IconHeart size={22} color="red" stroke={2} />
          )}
        </ActionIcon>

        <ImageSlider
          images={product.images || []}
          onImageClick={() => navigate(`/product/${product.id}`)}
          size="small"
          showDots={false}
          showButtonsOnHover={true}
        />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: rem(12),
            backgroundColor: "rgba(255,255,255,0.98)",
            zIndex: 35,
          }}
        >
          {!selectedSize ? (
            <Group justify="center" gap="xs">
              {availableSizes.map((size) => (
                <UnstyledButton
                  key={size}
                  onMouseEnter={() => setHoveredSize(size)}
                  onMouseLeave={() => setHoveredSize(null)}
                  onClick={() => {
                    setSelectedSize(size);
                  }}
                  className="transition-all"
                  style={{
                    fontSize: rem(13),
                    fontWeight: hoveredSize === size ? 700 : 400,
                    color: hoveredSize === size ? "black" : "#adb5bd",
                    padding: rem(4),
                  }}
                >
                  {size}
                </UnstyledButton>
              ))}
            </Group>
          ) : (
            <Button
              fullWidth
              size="sm"
              bg="black"
              radius={0}
              onClick={handleAddToCart}
              styles={{
                root: {
                  height: rem(42),
                  fontSize: rem(12),
                  letterSpacing: rem(1),
                  fontWeight: 600,
                },
              }}
            >
              SEPETE EKLE ({selectedSize})
            </Button>
          )}
        </motion.div>
      </Box>

      <Box
        pt="xs"
        style={{ cursor: "pointer" }}
        onClick={() => navigate(`/product/${product.id}`)}
      >
        <MantineText size="sm" c="gray.7" mb={4} truncate="end">
          {product.name}
        </MantineText>
        <MantineText size="md" fw={600} c="black">
          {formattedPrice} TL
        </MantineText>
      </Box>
    </Box>
  );
};

export default ProductCard;
