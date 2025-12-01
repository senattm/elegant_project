import { useState } from "react";
import { Box, Text, UnstyledButton } from "@mantine/core";
import { IconHeart, IconHeartFilled } from "@tabler/icons-react";
import { motion } from "framer-motion";
import { useFavorites, useCart } from "../store/hooks";
import type { Product } from "../store/atoms";

interface ProductCardProps {
  product: Product;
}

const SIZES = ["XS", "S", "M", "L", "XL"];

const ProductCard = ({ product }: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [hoveredSize, setHoveredSize] = useState<string | null>(null);

  const { isFavorite, toggleFavorite } = useFavorites();
  const { addToCart } = useCart();
  const isProductFavorite = isFavorite(product.id);

  const handleAddToCart = () => {
    if (!selectedSize) {
      return;
    }
    addToCart(product, 1, selectedSize);
    setSelectedSize(null);
    setIsHovered(false);
  };

  const serverUrl =
    import.meta.env.VITE_API_URL?.replace("/api", "") ||
    "http://localhost:5000";

  const getImageUrl = (url: string) => {
    if (!url) return "";
    return url.startsWith("http") ? url : `${serverUrl}${url}`;
  };

  const images = product.images || [];
  const currentImage =
    isHovered && images[1]
      ? getImageUrl(images[1])
      : images[0]
      ? getImageUrl(images[0])
      : "https://via.placeholder.com/400x600?text=No+Image";

  const sizeButtonBase: React.CSSProperties = {
    background: "transparent",
    border: "none",
    padding: "0 6px",
    fontSize: 12,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    cursor: "pointer",
    color: "#b0b0b0",
  };

  const handleSizeClick = (
    size: string,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.stopPropagation();
    setSelectedSize(size);
  };

  return (
    <Box
      style={{
        cursor: "pointer",
        position: "relative",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setSelectedSize(null);
        setHoveredSize(null);
      }}
    >
      <Box
        style={{
          position: "relative",
          aspectRatio: "3/4",
        }}
      >
        <UnstyledButton
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(product.id);
          }}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 10,
            padding: 8,
            backgroundColor: "white",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            transition: "transform 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          {isProductFavorite ? (
            <IconHeartFilled size={20} color="#000" />
          ) : (
            <IconHeart size={20} color="#000" />
          )}
        </UnstyledButton>

        <motion.img
          key={currentImage}
          src={currentImage}
          alt={product.name}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
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
            pointerEvents: isHovered ? "auto" : "none",
          }}
        >
          {!selectedSize ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 14,
              }}
            >
              {SIZES.map((size) => {
                const isActive = hoveredSize === size;

                return (
                  <button
                    key={size}
                    type="button"
                    style={{
                      ...sizeButtonBase,
                      color: isActive ? "#000000" : "#b0b0b0",
                      fontWeight: isActive ? 600 : 400,
                    }}
                    onMouseEnter={() => setHoveredSize(size)}
                    onMouseLeave={() => setHoveredSize(null)}
                    onClick={(e) => handleSizeClick(size, e)}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart();
              }}
              style={{
                width: "100%",
                backgroundColor: "#000",
                color: "#fff",
                border: "none",
                padding: "10px 20px",
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#333";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#000";
              }}
            >
              Sepete Ekle ({selectedSize})
            </button>
          )}
        </motion.div>
      </Box>

      <Box pt={8}>
        <Text
          size="sm"
          c="#666"
          style={{
            lineHeight: 1.4,
            fontWeight: 400,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            marginBottom: "4px",
          }}
        >
          {product.name}
        </Text>

        <Text
          size="sm"
          fw={600}
          c="black"
          style={{
            lineHeight: 1.4,
          }}
        >
          {typeof product.price === "number"
            ? product.price.toFixed(2)
            : parseFloat(product.price).toFixed(2)}{" "}
          TL
        </Text>
      </Box>
    </Box>
  );
};

export default ProductCard;
