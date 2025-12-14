import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Text,
  Box,
  Title,
  BackgroundImage,
  Overlay,
  Loader,
  Center,
} from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import { motion } from "framer-motion";
import Hero from "../components/Hero";
import { productsApi } from "../api/client";

const Home = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<
    Array<{
      name: string;
      image: string;
      description: string;
      product_count: number;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  const categoryImages: Record<string, string> = {
    Elbiseler: "elbise2.webp",
    "Ceketler & Kabanlar": "ceket3.webp",
    Ayakkabılar: "ayakkabi3.jpg",
    "Çantalar & Aksesuarlar": "canta2.jpg",
    "Bluzlar & Gömlekler": "gomlek2.webp",
    "Kazaklar & Hırkalar": "kazak4.webp",
    Pantolonlar: "pantolon2.webp",
  };

  const categoryDescriptions: Record<string, string> = {
    Elbiseler: "Zarif ve şık koleksiyon",
    "Ceketler & Kabanlar": "Modern stil",
    Ayakkabılar: "Konforlu adımlar",
    "Çantalar & Aksesuarlar": "Şıklığın tamamlayıcısı",
    "Bluzlar & Gömlekler": "Klasik ve modern",
    "Kazaklar & Hırkalar": "Sıcak ve rahat",
    Pantolonlar: "Her tarza uygun",
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await productsApi.getAll();
        const categoriesMap = new Map<string, number>();

        response.data.forEach((product: any) => {
          if (product.category) {
            const count = categoriesMap.get(product.category) || 0;
            categoriesMap.set(product.category, count + 1);
          }
        });

        const categoriesArray = Array.from(categoriesMap.entries())
          .map(([name, product_count]) => ({
            name,
            image: `http://localhost:5000/images/${
              categoryImages[name] || "deneme.jpg"
            }`,
            description: categoryDescriptions[name] || "Kaliteli ürünler",
            product_count,
          }))
          .filter((cat) => cat.product_count > 0);

        setCategories(categoriesArray);
      } catch (error) {
        console.error("Kategoriler yüklenemedi:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
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
              %10
            </Text>{" "}
            indirim kazanın
          </Text>
        </Container>
      </Box>

      <Container size="xl" py={80} id="categories">
        <Box mb={60}>
          <Title
            order={2}
            ta="center"
            mb={8}
            style={{
              fontSize: "40px",
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            Kategoriler
          </Title>
          <Text
            ta="center"
            c="#666"
            size="sm"
            style={{ letterSpacing: "0.5px" }}
          >
            Sizin için özenle seçtik
          </Text>
        </Box>

        {loading ? (
          <Center py={60}>
            <Loader color="black" />
          </Center>
        ) : (
          <Carousel
            slideSize={{ base: "100%", sm: "50%", md: "33.333%", lg: "25%" }}
            slideGap={{ base: "md", md: "xl" }}
            withControls
          >
            {categories.map((category, index) => (
              <Carousel.Slide key={category.name}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Box
                    onClick={() => {
                      navigate(
                        `/store?category=${encodeURIComponent(category.name)}`
                      );
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    style={{
                      cursor: "pointer",
                      position: "relative",
                      height: "450px",
                      borderRadius: "0px",
                      overflow: "hidden",
                    }}
                  >
                    <BackgroundImage
                      src={category.image}
                      style={{
                        height: "100%",
                        transition: "transform 0.5s ease",
                      }}
                      onMouseEnter={(e: any) => {
                        e.currentTarget.style.transform = "scale(1.05)";
                      }}
                      onMouseLeave={(e: any) => {
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                    >
                      <Overlay
                        gradient="linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.7) 100%)"
                        opacity={0.7}
                      />
                      <Box
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          padding: "24px",
                          zIndex: 1,
                        }}
                      >
                        <Title
                          order={3}
                          c="white"
                          mb={4}
                          style={{
                            fontSize: "28px",
                            letterSpacing: "2px",
                            textTransform: "uppercase",
                          }}
                        >
                          {category.name}
                        </Title>
                        <Text
                          c="white"
                          size="sm"
                          style={{
                            letterSpacing: "0.5px",
                            opacity: 0.9,
                          }}
                        >
                          {category.description}
                        </Text>
                      </Box>
                    </BackgroundImage>
                  </Box>
                </motion.div>
              </Carousel.Slide>
            ))}
          </Carousel>
        )}
      </Container>
    </Box>
  );
};

export default Home;
