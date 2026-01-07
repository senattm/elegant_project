import { useState, useEffect } from "react";
import { Box, ActionIcon } from "@mantine/core";
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
  images,
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

  // External selectedImage varsa onu kullan, yoksa internal state'i kullan
  const selectedImage = externalSelectedImage !== undefined ? externalSelectedImage : internalSelectedImage;
  
  const setSelectedImage = (index: number) => {
    if (onImageChange) {
      onImageChange(index);
    } else {
      setInternalSelectedImage(index);
    }
  };

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || images.length === 0) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      const newIndex = (selectedImage + 1) % images.length;
      setSelectedImage(newIndex);
    }
    if (isRightSwipe) {
      const newIndex = (selectedImage - 1 + images.length) % images.length;
      setSelectedImage(newIndex);
    }
  };

  const handlePreviousImage = () => {
    if (images.length === 0) return;
    const newIndex = (selectedImage - 1 + images.length) % images.length;
    setSelectedImage(newIndex);
  };

  const handleNextImage = () => {
    if (images.length === 0) return;
    const newIndex = (selectedImage + 1) % images.length;
    setSelectedImage(newIndex);
  };

  // Images değiştiğinde selectedImage'i sıfırla veya geçerli aralığa getir
  useEffect(() => {
    if (images && images.length > 0) {
      if (selectedImage >= images.length) {
        setSelectedImage(0);
      }
    } else {
      setSelectedImage(0);
    }
  }, [images]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePreviousImage();
      } else if (e.key === "ArrowRight") {
        handleNextImage();
      }
    };

    if (size === "large") {
      window.addEventListener("keydown", handleKeyPress);
      return () => window.removeEventListener("keydown", handleKeyPress);
    }
  }, [images.length, size]);

  // Null/undefined kontrolü ve boş array kontrolü
  if (!images || !Array.isArray(images) || images.length === 0) {
    return (
      <Box
        style={{
          width: "100%",
          aspectRatio: size === "small" ? "3/4" : "auto",
          backgroundColor: "#f5f5f5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span>No Image</span>
      </Box>
    );
  }

  // selectedImage'in geçerli aralıkta olduğundan emin ol
  const validSelectedImage = Math.max(0, Math.min(selectedImage, images.length - 1));

  const buttonSize = size === "small" ? "28px" : "36px";
  const iconSize = size === "small" ? 14 : 18;
  const buttonPosition = size === "small" ? "6px" : "10px";

  return (
    <Box
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: size === "small" ? "3/4" : "auto",
        minHeight: size === "large" ? "400px" : "auto",
        overflow: "hidden",
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {images.length > 1 && (
        <>
          <ActionIcon
            variant="filled"
            radius="xl"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handlePreviousImage();
            }}
            onMouseDown={(e) => e.preventDefault()}
            style={{
              position: "absolute",
              left: buttonPosition,
              top: "50%",
              transform: "translateY(-50%)",
              backgroundColor: "white",
              color: "black",
              boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
              zIndex: 30,
              cursor: "pointer",
              width: buttonSize,
              height: buttonSize,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: showButtonsOnHover ? (isHovered ? 1 : 0) : 1,
              transition: "opacity 0.2s, transform 0.1s",
              pointerEvents: showButtonsOnHover && !isHovered ? "none" : "auto",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.transform = "translateY(-50%) scale(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = showButtonsOnHover ? (isHovered ? 1 : 0) : "1";
              e.currentTarget.style.transform = "translateY(-50%) scale(1)";
            }}
          >
            <IconChevronLeft size={iconSize} stroke={2} />
          </ActionIcon>
          <ActionIcon
            variant="filled"
            radius="xl"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleNextImage();
            }}
            onMouseDown={(e) => e.preventDefault()}
            style={{
              position: "absolute",
              right: buttonPosition,
              top: "50%",
              transform: "translateY(-50%)",
              backgroundColor: "white",
              color: "black",
              boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
              zIndex: 30,
              cursor: "pointer",
              width: buttonSize,
              height: buttonSize,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: showButtonsOnHover ? (isHovered ? 1 : 0) : 1,
              transition: "opacity 0.2s, transform 0.1s",
              pointerEvents: showButtonsOnHover && !isHovered ? "none" : "auto",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.transform = "translateY(-50%) scale(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = showButtonsOnHover ? (isHovered ? 1 : 0) : "1";
              e.currentTarget.style.transform = "translateY(-50%) scale(1)";
            }}
          >
            <IconChevronRight size={iconSize} stroke={2} />
          </ActionIcon>
        </>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={validSelectedImage}
          initial={{ opacity: 0, x: size === "small" ? 10 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: size === "small" ? -10 : -20 }}
          transition={{ duration: size === "small" ? 0.2 : 0.3 }}
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "center",
            alignItems: size === "small" ? "center" : "flex-start",
            width: "100%",
            height: "100%",
            userSelect: "none",
            cursor: onImageClick ? "pointer" : "default",
          }}
          onClick={(e) => {
            if (onImageClick) {
              e.stopPropagation();
              onImageClick();
            } else {
              e.stopPropagation();
            }
          }}
        >
          <img
            src={getImageUrl(images[validSelectedImage] || "")}
            alt="Product"
            style={{
              width: size === "small" ? "100%" : "auto",
              height: size === "small" ? "100%" : "auto",
              maxWidth: size === "large" ? "600px" : "100%",
              maxHeight: size === "large" ? "600px" : "100%",
              objectFit: size === "small" ? "cover" : "contain",
              display: "block",
            }}
            onError={(e) => {
              console.error("Görsel yüklenemedi:", getImageUrl(images[validSelectedImage] || ""));
              e.currentTarget.src = "https://via.placeholder.com/400x600?text=Görsel+Yüklenemedi";
            }}
          />
        </motion.div>
      </AnimatePresence>

      {images.length > 1 && showDots && (
        <Box
          style={{
            position: "absolute",
            bottom: size === "small" ? "10px" : "20px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "6px",
            zIndex: 10,
          }}
        >
          {images.map((_, index) => (
            <Box
              key={index}
              onClick={() => setSelectedImage(index)}
              style={{
                width: selectedImage === index ? (size === "small" ? "16px" : "24px") : "6px",
                height: "6px",
                borderRadius: "3px",
                backgroundColor: selectedImage === index ? "black" : "rgba(255,255,255,0.5)",
                cursor: "pointer",
                transition: "all 0.3s",
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ImageSlider;

