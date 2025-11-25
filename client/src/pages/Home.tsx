import { useState, useEffect } from "react";
import { Container, Text, Box } from "@mantine/core";
import Hero from "../components/Hero";

interface Product {
  id: number;
  name: string;
}

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setFeaturedProducts([
        { id: 1, name: "Ürün 1" },
        { id: 2, name: "Ürün 2" },
        { id: 3, name: "Ürün 3" },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <Box>
      <Hero />   
      <Box
        bg="black"
        c="white"
        py="md"
      >
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

      <div style={{ padding: 40 }}>
        <h1>Öne Çıkan Koleksiyon</h1>

        {loading ? (
          <p>Yükleniyor...</p>
        ) : (
          <ul>
            {featuredProducts.map((p) => (
              <li key={p.id}>{p.name}</li>
            ))}
          </ul>
        )}
      </div>
    </Box>
  );
};

export default Home;
