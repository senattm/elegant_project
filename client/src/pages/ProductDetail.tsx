import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Grid,
  Box,
  Text,
  Title,
  Button,
  Group,
  Stack,
  Image,
  UnstyledButton,
  ActionIcon,
} from "@mantine/core";
import { IconHeart, IconHeartFilled } from "@tabler/icons-react";
import { useCart, useFavorites } from "../store/hooks";
import type { Product } from "../types";

import PageLayout from "../components/layout/PageLayout";
import BackButton from "../components/ui/BackButton";
import QuantitySelector from "../components/ui/QuantitySelector";
import LoadingState from "../components/ui/LoadingState";
import EmptyState from "../components/ui/EmptyState";
import ImageSlider from "../components/ui/ImageSlider";
import { getImageUrl } from "../utils/imageUrl";
import { getProductSizes } from "../utils/productUtils";
import { productsApi } from "../api/client";



const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await productsApi.getById(Number(id));
        setProduct(response.data);
      } catch (error) {
        console.error("Ürün yüklenemedi:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  if (loading) {
    return <LoadingState message="Ürün yükleniyor..." />;
  }

  if (!product) {
    return (
      <PageLayout>
        <EmptyState
          message="Ürün bulunamadı"
          actionLabel="Ana Sayfaya Dön"
          onAction={() => navigate("/")}
        />
      </PageLayout>
    );
  }

  const images = product.images || [];
  const isProductFavorite = isFavorite(product.id);
  
  const variants = product.variants && product.variants.length > 0 
    ? product.variants 
    : null;
  const availableSizes = variants 
    ? variants.map(v => v.size).filter((s): s is string => s !== null)
    : getProductSizes(product.category_id, product.parent_category_id);
  
  const selectedVariant = variants?.find(v => v.size === selectedSize);
  const displayPrice = selectedVariant?.price || 
    (typeof product.price === "number" ? product.price : parseFloat(product.price));
  const displayStock = selectedVariant?.stock ?? product.stock;

  const handleAddToCart = () => {
    if (!product || !selectedSize) return;
    
    if (variants) {
      const variant = variants.find(v => v.size === selectedSize);
      if (variant) {
        addToCart(product, quantity, variant.id, selectedSize);
      }
    } else {
      addToCart(product, quantity, undefined, selectedSize);
    }
  };

  return (
    <PageLayout pt={{ base: 120, md: 140 }}>
      <BackButton />

      <Box className="flex-center">
        <Grid align="flex-start" maw={1200} w="100%">
          <Grid.Col span={{ base: 12, md: 7 }}>
            <Box style={{ display: "flex", gap: 16, maxWidth: "100%" }}>
              {images.length > 1 && (
                <Stack gap="sm" style={{ width: 80, flexShrink: 0 }}>
                  {images.map((img, index) => (
                    <UnstyledButton
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      onMouseEnter={() => { }}
                      className="cursor-pointer transition-all flex-center"
                      style={{
                        border:
                          selectedImage === index
                            ? "2px solid black"
                            : "2px solid transparent",
                        opacity: selectedImage === index ? 1 : 0.6,
                        width: "80px",
                        height: "80px",
                        backgroundColor: "#f5f5f5",
                        overflow: "hidden",
                      }}
                    >
                      <Image
                        src={getImageUrl(img)}
                        alt={`${product.name} ${index + 1}`}
                        w={80}
                        h={80}
                        fit="contain"
                        style={{ pointerEvents: "none" }}
                      />
                    </UnstyledButton>
                  ))}
                </Stack>
              )}

              <Box flex={1} pos="relative" className="flex-start">
                <Box pos="relative" w="100%">
                  <ImageSlider
                    images={images}
                    size="large"
                    showDots={images.length > 1}
                    selectedImage={selectedImage}
                    onImageChange={setSelectedImage}
                  />
                  <ActionIcon
                    variant="filled"
                    radius="xl"
                    size="xl"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(product.id);
                    }}
                    pos="absolute"
                    top={20}
                    right={20}
                    bg="white"
                    style={{
                      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                      zIndex: 40,
                    }}
                  >
                    {isProductFavorite ? (
                      <IconHeartFilled size={24} color="red" />
                    ) : (
                      <IconHeart size={24} color="red" />
                    )}
                  </ActionIcon>
                </Box>
              </Box>
            </Box>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 5 }}>
            <Stack gap="xl" pos="sticky" top={160}>
              <Box>
                <Text
                  size="sm"
                  c="dimmed"
                  tt="uppercase"
                  mb={8}
                  style={{ letterSpacing: "0.1em" }}
                >
                  {product.category}
                </Text>
                <Title order={1} fz={{ base: 28, md: 36 }}>
                  {product.name}
                </Title>
              </Box>

              <Text fz={28} fw={600}>
                {displayPrice.toFixed(2)} TL
              </Text>

              {product.description && (
                <Text c="dimmed" lh={1.8}>
                  {product.description}
                </Text>
              )}

              <Box>
                <Text
                  size="sm"
                  fw={600}
                  tt="uppercase"
                  mb={12}
                  style={{ letterSpacing: "0.05em" }}
                >
                  Beden
                </Text>
                <Group gap="sm">
                  {availableSizes.map((size) => {
                    const variant = variants?.find(v => v.size === size);
                    const isSelected = selectedSize === size;
                    const isOutOfStock = variant ? variant.stock === 0 : false;
                    
                    return (
                      <UnstyledButton
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        disabled={isOutOfStock}
                        className="flex-center transition-all"
                        style={{
                          width: 48,
                          height: 48,
                          border: isSelected ? "2px solid black" : "1px solid #ddd",
                          backgroundColor: isSelected ? "black" : isOutOfStock ? "#f5f5f5" : "white",
                          color: isSelected ? "white" : isOutOfStock ? "#ccc" : "black",
                          fontWeight: isSelected ? 600 : 400,
                          opacity: isOutOfStock ? 0.5 : 1,
                          cursor: isOutOfStock ? "not-allowed" : "pointer",
                        }}
                        title={isOutOfStock ? "Stokta yok" : undefined}
                      >
                        {size || "N/A"}
                      </UnstyledButton>
                    );
                  })}
                </Group>
              </Box>

              <Box>
                <Text
                  size="sm"
                  fw={600}
                  tt="uppercase"
                  mb={12}
                  style={{ letterSpacing: "0.05em" }}
                >
                  Adet
                </Text>
                <QuantitySelector
                  value={quantity}
                  onChange={setQuantity}
                  min={1}
                />
              </Box>

              <Button
                fullWidth
                disabled={!selectedSize || displayStock === 0}
                onClick={handleAddToCart}
                style={{
                  height: 56,
                }}
              >
                {!selectedSize ? "BEDEN SEÇİN" : displayStock === 0 ? "STOKTA YOK" : "SEPETE EKLE"}
              </Button>

              {displayStock !== undefined && displayStock > 0 && displayStock < 10 && (
                <Text size="sm" c="orange" ta="center">
                  Son {displayStock} ürün!
                </Text>
              )}
              {displayStock === 0 && (
                <Text size="sm" c="red" ta="center">
                  Stokta yok
                </Text>
              )}
            </Stack>
          </Grid.Col>
        </Grid>
      </Box>
    </PageLayout>
  );
};

export default ProductDetail;
