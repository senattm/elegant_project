import { useState, useEffect } from "react";
import { Box, ActionIcon, Group, Image, rem, Center, Text as MantineText } from "@mantine/core";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { getImageUrl } from "../../utils/imageUrl";

interface ImageSliderProps {
  images: string[];
  onImageClick?: () => void;
  size?: "small" | "large";
  showDots?: boolean;
  showButtonsOnHover?: boolean;
  selectedImage?: number;
  onImageChange?: (index: number) => void;
}

const ImageSlider = ({
  images = [],
  onImageClick,
  size = "large",
  showDots = true,
  showButtonsOnHover = false,
  selectedImage: externalSelectedImage,
  onImageChange,
}: ImageSliderProps) => {
  const [internalSelectedImage, setInternalSelectedImage] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const selectedImage = externalSelectedImage ?? internalSelectedImage;

  const setSelectedImage = (index: number) => {
    onImageChange ? onImageChange(index) : setInternalSelectedImage(index);
  };

  const handlePreviousImage = () => {
    if (images.length === 0) return;
    setSelectedImage((selectedImage - 1 + images.length) % images.length);
  };

  const handleNextImage = () => {
    if (images.length === 0) return;
    setSelectedImage((selectedImage + 1) % images.length);
  };

  useEffect(() => {
    if (images.length > 0 && selectedImage >= images.length) {
      setSelectedImage(0);
    }
  }, [images.length]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePreviousImage();
      if (e.key === "ArrowRight") handleNextImage();
    };

    if (size === "large") {
      window.addEventListener("keydown", handleKeyPress);
      return () => window.removeEventListener("keydown", handleKeyPress);
    }
  }, [selectedImage, size, images.length]);

  if (!images?.length) {
    return (
      <Center 
        bg="gray.1" 
        w="100%" 
        style={{ aspectRatio: size === "small" ? "3/4" : "16/9" }}
      >
        <MantineText c="dimmed">No Image</MantineText>
      </Center>
    );
  }

  const validIndex = Math.max(0, Math.min(selectedImage, images.length - 1));
  const buttonSize = size === "small" ? 32 : 40;
  const buttonPos = size === "small" ? 8 : 12;

  const actionButtonStyles = {
    backgroundColor: "white",
    color: "black",
    zIndex: 30,
    border: "none", // Kenarlığı tamamen kaldırdım
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)", // Hafif ve modern bir gölge
    opacity: showButtonsOnHover ? (isHovered ? 1 : 0) : 1,
    transition: "all 0.2s ease",
    cursor: "pointer",
    // Tıklanmış/Odaklanmış kalmayı engelleyen kritik kurallar
    outline: "none",
    "&:focus, &:focus-visible, &:active": {
      outline: "none",
      boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
      backgroundColor: "white",
    },
    "&:hover": {
      backgroundColor: "#fafafa",
      transform: "translateY(-50%) scale(1.05)",
    },
  };

  return (
    <Box
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={(e) => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); }}
      onTouchMove={(e) => setTouchEnd(e.targetTouches[0].clientX)}
      onTouchEnd={() => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        if (distance > 50) handleNextImage();
        if (distance < -50) handlePreviousImage();
      }}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: size === "small" ? "3/4" : "auto",
        minHeight: size === "large" ? rem(400) : "auto",
        overflow: "hidden",
      }}
    >
      {images.length > 1 && (
        <>
          <ActionIcon
            radius="xl"
            size={buttonSize}
            onClick={(e) => { e.stopPropagation(); handlePreviousImage(); }}
            style={{
              ...actionButtonStyles,
              position: "absolute",
              left: rem(buttonPos),
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: showButtonsOnHover && !isHovered ? "none" : "auto",
            }}
          >
            <IconChevronLeft size={size === "small" ? 18 : 22} stroke={1.5} />
          </ActionIcon>
          <ActionIcon
            radius="xl"
            size={buttonSize}
            onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
            style={{
              ...actionButtonStyles,
              position: "absolute",
              right: rem(buttonPos),
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: showButtonsOnHover && !isHovered ? "none" : "auto",
            }}
          >
            <IconChevronRight size={size === "small" ? 18 : 22} stroke={1.5} />
          </ActionIcon>
        </>
      )}

      <AnimatePresence mode="wait">
        <Box
          component={motion.div}
          key={validIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onImageClick}
          style={{
            width: "100%",
            height: "100%",
            cursor: onImageClick ? "pointer" : "default",
            display: "flex",
            justifyContent: "center",
            alignItems: size === "small" ? "center" : "flex-start",
          }}
        >
          <Image
            src={getImageUrl(images[validIndex] || "")}
            alt="Product"
            w={size === "small" ? "100%" : "auto"}
            h={size === "small" ? "100%" : "auto"}
            fit={size === "small" ? "cover" : "contain"}
            style={{
              maxWidth: size === "large" ? rem(600) : "100%",
              maxHeight: size === "large" ? rem(600) : "100%",
            }}
            fallbackSrc="https://via.placeholder.com/400x600?text=Gorsel+Yok"
          />
        </Box>
      </AnimatePresence>

      {images.length > 1 && showDots && (
        <Group
          gap={6}
          style={{
            position: "absolute",
            bottom: size === "small" ? rem(10) : rem(20),
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
          }}
        >
          {images.map((_, index) => (
            <Box
              key={index}
              onClick={() => setSelectedImage(index)}
              style={{
                width: selectedImage === index ? (size === "small" ? rem(16) : rem(24)) : rem(6),
                height: rem(6),
                borderRadius: rem(3),
                backgroundColor: selectedImage === index ? "black" : "rgba(255,255,255,0.5)",
                cursor: "pointer",
                transition: "all 0.3s",
              }}
            />
          ))}
        </Group>
      )}
    </Box>
  );
};

export default ImageSlider;