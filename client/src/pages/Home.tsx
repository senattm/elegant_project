import { useEffect } from "react";
import {
  Container,
  Text,
  Box,
  SimpleGrid,
  Title,
  Loader,
  Center,
} from "@mantine/core";
import Hero from "../components/Hero";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../store/hooks";

const Home = () => {
  const { products, loading, fetchProducts } = useProducts();

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <Box>
      <Hero />
      <Box bg="black" c="white" py="md">
        <Container>
          <Text ta="center" size="sm" style={{ letterSpacing: "0.05em" }}>
            İlk alışverişinizde{" "}
            <Text
              component="span"
              fw={600}
              style={{
                borderBottom: "1px solid rgba(255,255,255,0.5)",
                paddingBottom: 2,
              }}
            >
              İLK10
            </Text>{" "}
            koduyla %10 indirim kazanın
          </Text>
        </Container>
      </Box>

      <Container size="xl" py={60}>
        <Box mb={40}>
          <Title
            order={2}
            ta="center"
            mb={8}
            style={{
              fontWeight: 300,
              fontSize: "32px",
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            Yeni Sezon
          </Title>
          <Text
            ta="center"
            c="#666"
            size="sm"
            style={{ letterSpacing: "0.5px" }}
          >
            En yeni koleksiyonumuzu keşfedin
          </Text>
        </Box>

        {loading && (
          <Center py={60}>
            <Loader color="black" size="lg" />
            <Text ml={16}>Ürünler yükleniyor...</Text>
          </Center>
        )}

        {!loading && products.length === 0 && (
          <Center py={60}>
            <Text c="dimmed">Henüz ürün bulunmuyor.</Text>
          </Center>
        )}

        {!loading && products.length > 0 && (
          <Box>
            <Text mb={16} c="dimmed" size="sm">
              Toplam {products.length} ürün gösteriliyor
            </Text>
            <SimpleGrid
              cols={{ base: 1, xs: 2, sm: 2, md: 3, lg: 4 }}
              spacing={{ base: 24, sm: 24, md: 32 }}
            >
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </SimpleGrid>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default Home;
