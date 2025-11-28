import { Container, Text, SimpleGrid, Box, Group, ActionIcon } from "@mantine/core";
import { IconHeart, IconSearch, IconShoppingBag, IconUser } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useFavorites } from "../store/hooks/useFavorites";
import { useProducts } from "../store/hooks/useProducts";
import { useEffect } from "react";
import ProductCard from "../components/ProductCard";

const Favorites = () => {
  const navigate = useNavigate();
  const { favorites } = useFavorites();
  const { products, fetchProducts } = useProducts();

  useEffect(() => {
    fetchProducts();
  }, []);

  const favoriteProducts = products.filter((product) =>
    favorites.includes(product.id)
  );

  return (
    <Box style={{ minHeight: "100vh" }}>
      <Box
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          backgroundColor: "white",
          borderBottom: "1px solid #e9ecef",
        }}
      >
        <Container size="xl" style={{ padding: "20px 0" }}>
          <Group justify="space-between" align="center">
            <Text
              onClick={() => navigate("/")}
              style={{
                fontSize: "2.2rem",
                fontWeight: 400,
                fontFamily: "Playfair Display, serif",
                letterSpacing: "0.15em",
                cursor: "pointer",
              }}
            >
              ELEGĀNT
            </Text>

            <Group gap="md">
              <ActionIcon variant="transparent" color="dark" size="lg">
                <IconSearch size={22} />
              </ActionIcon>

              <ActionIcon 
                variant="transparent" 
                color="dark" 
                size="lg"
                onClick={() => navigate("/favorites")}
                style={{ position: "relative" }}
              >
                <IconHeart size={22} />
                {favorites.length > 0 && (
                  <Box
                    style={{
                      position: "absolute",
                      top: -2,
                      right: -2,
                      backgroundColor: "#000",
                      color: "white",
                      borderRadius: "50%",
                      width: "16px",
                      height: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "9px",
                      fontWeight: 600,
                    }}
                  >
                    {favorites.length}
                  </Box>
                )}
              </ActionIcon>

              <ActionIcon variant="transparent" color="dark" size="lg">
                <IconShoppingBag size={22} />
              </ActionIcon>

              <ActionIcon 
                variant="transparent" 
                color="dark" 
                size="lg"
                onClick={() => navigate("/auth")}
              >
                <IconUser size={22} />
              </ActionIcon>
            </Group>
          </Group>
        </Container>
      </Box>

      <Box style={{ paddingTop: "100px", paddingBottom: "60px" }}>
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
                  fontSize: "16px",
                  color: "#495057",
                  marginBottom: "10px",
                  fontWeight: 300,
                }}
              >
                Henüz favori ürününüz yok
              </Text>
              <Text
                style={{
                  fontSize: "13px",
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
    </Box>
  );
};

export default Favorites;
