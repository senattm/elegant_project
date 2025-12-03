import { Container, Text, SimpleGrid, Box } from "@mantine/core";
import { IconHeart } from "@tabler/icons-react";
import { useFavorites } from "../store/hooks/useFavorites";
import { useProducts } from "../store/hooks/useProducts";
import { useEffect } from "react";
import ProductCard from "../components/ProductCard";
import { useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import { isAuthenticatedAtom } from "../store/atoms";

const Favorites = () => {
  const navigate = useNavigate();
  const [isAuthenticated] = useAtom(isAuthenticatedAtom);
  const { favorites } = useFavorites();
  const { products, fetchProducts } = useProducts();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const favoriteProducts = products.filter((product) =>
    favorites.includes(product.id)
  );

  const titleStyle = {
    fontWeight: 300,
    marginBottom: "12px",
    letterSpacing: "0.1em",
    fontFamily: "Playfair Display, serif",
  };

  const emptyIconStyle = {
    color: "#e9ecef",
    marginBottom: "20px",
  };

  return (
    <Box mih="100vh" pt={{ base: 250, sm: 180, md: 140 }} pb={60}>
      <Container size="xl">
        <Box mb={50} ta="center">
          <Text fz={{ base: 28, sm: 36, md: 42 }} style={titleStyle}>
            FAVORİLERİM
          </Text>
          <Text
            size="sm"
            c="dimmed"
            tt="uppercase"
            style={{ letterSpacing: "0.08em" }}
          >
            {favoriteProducts.length} Ürün
          </Text>
        </Box>

        {favoriteProducts.length === 0 ? (
          <Box ta="center" py={100}>
            <IconHeart size={64} style={emptyIconStyle} />
            <Text size="lg" c="#495057" mb={10}>
              Henüz favori ürününüz yok
            </Text>
            <Text size="sm" c="#adb5bd">
              Beğendiğiniz ürünleri favorilerinize ekleyebilirsiniz
            </Text>
          </Box>
        ) : (
          <SimpleGrid
            cols={{ base: 1, xs: 2, sm: 2, md: 3, lg: 4 }}
            spacing="lg"
          >
            {favoriteProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </SimpleGrid>
        )}
      </Container>
    </Box>
  );
};

export default Favorites;
