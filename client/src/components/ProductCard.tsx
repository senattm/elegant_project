import { useState } from "react";
import { Box, Text, UnstyledButton } from "@mantine/core";
import { IconHeart, IconHeartFilled } from "@tabler/icons-react";
import { motion } from "framer-motion";
import type { Product } from "../types/product";

interface ProductCardProps {
  product: Product;
}

const SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL"];

const ProductCard = ({ product }: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [hoveredSize, setHoveredSize] = useState<string | null>(null);

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
            setIsFavorite(!isFavorite);
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
          {isFavorite ? (
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
    display: "flex",
    justifyContent: "center",
    gap: 14,
  }}
>
  {SIZES.map((size) => {
    const isActive = selectedSize === size || hoveredSize === size;

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
</motion.div>

      </Box>

      <Box pt={12}>
        <Text
          size="sm"
          c="#666"
          mb={4}
          style={{
            lineHeight: 1.,
            fontWeight: 400,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {product.name}
        </Text>

        <Text size="sm" fw={600} c="black">
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
