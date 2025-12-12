import { useState, useMemo, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Text,
  UnstyledButton,
  Button,
  Group,
  ActionIcon,
} from "@mantine/core";
import { IconHeart, IconHeartFilled } from "@tabler/icons-react";
import { motion } from "framer-motion";
import { useFavorites, useCart } from "../store/hooks";
import type { Product } from "../store/atoms";

interface ProductCardProps {
  product: Product;
}

const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL"];
const SHOE_SIZES = ["36", "37", "38", "39", "40", "41"];
const BAG_SIZES = ["STD"];

const CATEGORY_IDS = {
  SHOES: 7,
  BAGS: 8,
};

const SERVER_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

const getImageUrl = (url: string) => {
  if (!url) return "";
  return url.startsWith("http") ? url : `${SERVER_URL}${url}`;
};

const getSizesForCategory = (categoryId: number): string[] => {
  if (categoryId === CATEGORY_IDS.BAGS) {
    return BAG_SIZES;
  }

  if (categoryId === CATEGORY_IDS.SHOES) {
    return SHOE_SIZES;
  }

  return CLOTHING_SIZES;
};

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

  const availableSizes = getSizesForCategory(product.category_id);

  const handleAddToCart = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!selectedSize) return;
    addToCart(product, 1, selectedSize);
    setSelectedSize(null);
    setIsHovered(false);
  };

  const handleSizeClick = (size: string, e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setSelectedSize(size);
  };

  const images = product.images || [];

  const currentImage = useMemo(() => {
    if (isHovered && images[1]) return getImageUrl(images[1]);
    if (images[0]) return getImageUrl(images[0]);
    return "https://via.placeholder.com/400x600?text=No+Image";
  }, [isHovered, images]);

  const handleImageClick = (e: MouseEvent<HTMLImageElement>) => {
    e.stopPropagation();
    navigate(`/product/${product.id}`);
  };

  return (
    <Box
      style={{ cursor: "pointer", position: "relative" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setSelectedSize(null);
        setHoveredSize(null);
      }}
    >
      <Box style={{ position: "relative", aspectRatio: "3/4" }}>
        <ActionIcon
          variant="filled"
          radius="xl"
          size="lg"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(product.id);
          }}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 10,
          }}
          styles={{
            root: {
              backgroundColor: "white",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              transition: "transform 0.2s ease",
            },
          }}
        >
          {isProductFavorite ? (
            <IconHeartFilled size={22} color="red" />
          ) : (
            <IconHeart size={22} color="red" />
          )}
        </ActionIcon>

        <motion.img
          key={currentImage}
          src={currentImage}
          alt={product.name}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          onClick={handleImageClick}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            cursor: "pointer",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
          transition={{ duration: 0.3 }}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "10px 16px",
            backgroundColor: "rgba(255,255,255,0.96)",
          }}
        >
          {!selectedSize ? (
            <Group justify="center" gap={14}>
              {availableSizes.map((size) => {
                const isActive = hoveredSize === size;
                return (
                  <UnstyledButton
                    key={size}
                    onMouseEnter={() => setHoveredSize(size)}
                    onMouseLeave={() => setHoveredSize(null)}
                    onClick={(e) => handleSizeClick(size, e)}
                    style={{
                      background: "transparent",
                      border: "none",
                      padding: "6px",
                      fontSize: 14,
                      cursor: "pointer",
                      color: isActive ? "#000000" : "#b0b0b0",
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    {size}
                  </UnstyledButton>
                );
              })}
            </Group>
          ) : (
            <Button fullWidth size="sm" onClick={handleAddToCart}>
              SEPETE EKLE ({selectedSize})
            </Button>
          )}
        </motion.div>
      </Box>

      <Box pt={8} onClick={() => navigate(`/product/${product.id}`)}>
        <Text
          size="sm"
          c="#666"
          style={{
            marginBottom: "4px",
          }}
        >
          {product.name}
        </Text>

        <Text size="sm" fw={600} c="black">
          {formattedPrice} TL
        </Text>
      </Box>
    </Box>
  );
};

export default ProductCard;
