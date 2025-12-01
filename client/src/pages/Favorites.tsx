import { Container, Text, SimpleGrid, Box } from "@mantine/core";
import { IconHeart } from "@tabler/icons-react";
import { useFavorites } from "../store/hooks/useFavorites";
import { useProducts } from "../store/hooks/useProducts";
import { useEffect } from "react";
import ProductCard from "../components/ProductCard";

const Favorites = () => {
  const { favorites } = useFavorites();
  const { products, fetchProducts } = useProducts();

  useEffect(() => {
    fetchProducts();
  }, []);

  const favoriteProducts = products.filter((product) =>
    favorites.includes(product.id)
  );

  return (
    <Box style={{ minHeight: "100vh", paddingTop: "140px", paddingBottom: "60px" }}>
      <Container size="xl">
        <Box style={{ marginBottom: "50px", textAlign: "center" }}>
          <Text
            style={{
              fontSize: "42px",
              fontWeight: 300,
              marginBottom: "12px",
              letterSpacing: "0.1em",
              fontFamily: "Playfair Display, serif",
            }}
          >
            FAVORİLERİM
          </Text>
          <Text
            style={{
              fontSize: "13px",
              color: "#868e96",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {favoriteProducts.length} Ürün
          </Text>
        </Box>

        {favoriteProducts.length === 0 ? (
          <Box
            style={{
              textAlign: "center",
              padding: "100px 20px",
            }}
          >
            <IconHeart
              size={64}
              style={{
                color: "#e9ecef",
                marginBottom: "20px",
              }}
            />
            <Text
              style={{
                fontSize: "18px",
                color: "#495057",
                marginBottom: "10px",
              }}
            >
              Henüz favori ürününüz yok
            </Text>
            <Text
              style={{
                fontSize: "14px",
                color: "#adb5bd",
              }}
            >
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
