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
import axios from "axios";
import PageLayout from "../components/layout/PageLayout";
import BackButton from "../components/ui/BackButton";
import QuantitySelector from "../components/ui/QuantitySelector";
import LoadingState from "../components/ui/LoadingState";
import EmptyState from "../components/ui/EmptyState";
import ImageSlider from "../components/ui/ImageSlider";
import { getImageUrl } from "../utils/imageUrl";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL"];
const SHOE_SIZES = ["36", "37", "38", "39", "40", "41"];
const BAG_SIZES = ["STD"];

const CATEGORY_IDS = {
  SHOES: 7,
  BAGS: 8,
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
        const response = await axios.get(`${API_URL}/products/${id}`);
        setProduct(response.data);
      } catch (error) {
        console.error("Ürün yüklenemedi:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product || !selectedSize) return;
    addToCart(product, quantity, selectedSize);
  };

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
  const price =
    typeof product.price === "number"
      ? product.price
      : parseFloat(product.price);
  const availableSizes = getSizesForCategory(product.category_id);

  return (
    <PageLayout pt={{ base: 120, md: 140 }}>
      <BackButton />

      <Box style={{ display: "flex", justifyContent: "center" }}>
        <Grid align="flex-start" style={{ maxWidth: "1200px", width: "100%" }}>
          <Grid.Col span={{ base: 12, md: 7 }}>
            <Box style={{ display: "flex", gap: 16, maxWidth: "100%" }}>
              {images.length > 1 && (
                <Stack gap="sm" style={{ width: 80, flexShrink: 0 }}>
                  {images.map((img, index) => (
                    <UnstyledButton
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      onMouseEnter={() => {}}
                      style={{
                        border:
                          selectedImage === index
                            ? "2px solid black"
                            : "2px solid transparent",
                        opacity: selectedImage === index ? 1 : 0.6,
                        transition: "all 0.2s",
                        width: "80px",
                        height: "80px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#f5f5f5",
                        overflow: "hidden",
                        cursor: "pointer",
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

              <Box
                style={{
                  flex: 1,
                  position: "relative",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "flex-start",
                }}
              >
                <Box style={{ position: "relative", width: "100%" }}>
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
                    style={{
                      position: "absolute",
                      top: "20px",
                      right: "20px",
                      backgroundColor: "white",
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
            <Stack gap="xl" style={{ position: "sticky", top: 160 }}>
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
                {price.toFixed(2)} TL
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
                  {availableSizes.map((size) => (
                    <UnstyledButton
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      style={{
                        width: 48,
                        height: 48,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border:
                          selectedSize === size
                            ? "2px solid black"
                            : "1px solid #ddd",
                        backgroundColor:
                          selectedSize === size ? "black" : "white",
                        color: selectedSize === size ? "white" : "black",
                        fontWeight: selectedSize === size ? 600 : 400,
                        transition: "all 0.2s",
                      }}
                    >
                      {size}
                    </UnstyledButton>
                  ))}
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
                disabled={!selectedSize}
                onClick={handleAddToCart}
                style={{
                  height: 56,
                }}
              >
                {selectedSize ? "SEPETE EKLE" : "BEDEN SEÇİN"}
              </Button>

              {product.stock !== undefined && product.stock < 10 && (
                <Text size="sm" c="orange" ta="center">
                  Son {product.stock} ürün!
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
