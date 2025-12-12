import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Grid,
  Box,
  Text,
  Title,
  Button,
  Group,
  Stack,
  Image,
  Loader,
  Center,
  UnstyledButton,
  ActionIcon,
} from "@mantine/core";
import {
  IconHeart,
  IconHeartFilled,
  IconArrowLeft,
  IconMinus,
  IconPlus,
} from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart, useFavorites } from "../store/hooks";
import type { Product } from "../types";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const SERVER_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL"];
const SHOE_SIZES = ["36", "37", "38", "39", "40", "41"];
const BAG_SIZES = ["STD"];

const getSizesForCategory = (category: string): string[] => {
  const lowerCategory = category?.toLowerCase().trim() || "";

  if (
    lowerCategory.includes("çanta") ||
    lowerCategory.includes("bag") ||
    lowerCategory === "çantalar" ||
    lowerCategory === "bags"
  ) {
    return BAG_SIZES;
  }

  if (
    lowerCategory.includes("ayakkabı") ||
    lowerCategory.includes("shoe") ||
    lowerCategory === "ayakkabılar" ||
    lowerCategory === "shoes"
  ) {
    return SHOE_SIZES;
  }

  return CLOTHING_SIZES;
};

const getImageUrl = (url: string) => {
  if (!url) return "";
  return url.startsWith("http") ? url : `${SERVER_URL}${url}`;
};

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

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

  const titleStyle = {
    fontWeight: 300,
    letterSpacing: "0.1em",
    fontFamily: "Playfair Display, serif",
  };

  if (loading) {
    return (
      <Center mih="100vh">
        <Loader color="black" size="lg" />
      </Center>
    );
  }

  if (!product) {
    return (
      <Center mih="100vh">
        <Stack align="center" gap="md">
          <Text size="lg" c="dimmed">
            Ürün bulunamadı
          </Text>
          <Button variant="outline" color="dark" onClick={() => navigate("/")}>
            Ana Sayfaya Dön
          </Button>
        </Stack>
      </Center>
    );
  }

  const images = product.images || [];
  const isProductFavorite = isFavorite(product.id);
  const price =
    typeof product.price === "number"
      ? product.price
      : parseFloat(product.price);
  const availableSizes = getSizesForCategory(product.category || "");

  return (
    <Box mih="100vh" pt={{ base: 120, md: 140 }} pb={80}>
      <Container size="xl">
        <UnstyledButton
          onClick={() => navigate(-1)}
          mb={30}
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <IconArrowLeft size={20} />
          <Text size="sm" tt="uppercase" style={{ letterSpacing: "0.05em" }}>
            Geri
          </Text>
        </UnstyledButton>

        <Grid gutter={60}>
          <Grid.Col span={{ base: 12, md: 7 }}>
            <Box style={{ display: "flex", gap: 16 }}>
              {images.length > 1 && (
                <Stack gap="sm" style={{ width: 80 }}>
                  {images.map((img, index) => (
                    <UnstyledButton
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      style={{
                        border:
                          selectedImage === index
                            ? "2px solid black"
                            : "2px solid transparent",
                        opacity: selectedImage === index ? 1 : 0.6,
                        transition: "all 0.2s",
                      }}
                    >
                      <Image
                        src={getImageUrl(img)}
                        alt={`${product.name} ${index + 1}`}
                        h={100}
                        fit="cover"
                      />
                    </UnstyledButton>
                  ))}
                </Stack>
              )}

              <Box style={{ flex: 1, position: "relative" }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedImage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Image
                      src={getImageUrl(images[selectedImage] || "")}
                      alt={product.name}
                      h={{ base: 500, md: 650 }}
                      fit="cover"
                    />
                  </motion.div>
                </AnimatePresence>

                <ActionIcon
                  variant="filled"
                  radius="xl"
                  size="xl"
                  onClick={() => toggleFavorite(product.id)}
                  style={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    backgroundColor: "white",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
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
                <Title order={1} style={titleStyle} fz={{ base: 28, md: 36 }}>
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
                <Group gap="sm">
                  <ActionIcon
                    variant="outline"
                    color="dark"
                    size="lg"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <IconMinus size={18} />
                  </ActionIcon>
                  <Text w={40} ta="center" fz={18} fw={600}>
                    {quantity}
                  </Text>
                  <ActionIcon
                    variant="outline"
                    color="dark"
                    size="lg"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <IconPlus size={18} />
                  </ActionIcon>
                </Group>
              </Box>

              <Button
                fullWidth
                size="xl"
                color="dark"
                disabled={!selectedSize}
                onClick={handleAddToCart}
                style={{
                  letterSpacing: "0.1em",
                  fontWeight: 600,
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
      </Container>
    </Box>
  );
};

export default ProductDetail;
