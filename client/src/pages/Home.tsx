import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Text,
  Box,
  Title,
  BackgroundImage,
  Loader,
  Center,
} from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import { motion } from "framer-motion";
import Hero from "../components/features/Hero";
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
    Elbiseler: "kategori_elbise.png",
    "Ceketler & Kabanlar": "kategori_ceket.png",
    Ayakkabılar: "kategori_ayakkabı.png",
    "Çantalar & Aksesuarlar": "kategori_canta.jpg",
    "Bluzlar & Gömlekler": "kategori_gomlek.png",
    "Kazaklar & Hırkalar": "kategori_kazak.jpg",
    Pantolonlar: "kategori_pantolon.png",
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
            image: `http://localhost:5000/images/${categoryImages[name] || "deneme.jpg"
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
              pb={2}
              style={{
                borderBottom: "1px solid rgba(255,255,255,0.5)",
              }}
            >
              %10
            </Text>{" "}
            indirim kazanın
          </Text>
        </Container>
      </Box>

      <Container size="xl" pt={80} pb={20} id="categories">
        <Box mb={60}>
          <Title
            order={2}
            ta="center"
            mb={8}
            fz={40}
            style={{ letterSpacing: "2px" }}
          >
            KATEGORİLER
          </Title>
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
                    pos="relative"
                    style={{
                      cursor: "pointer",
                      aspectRatio: "1/1",
                      overflow: "hidden",
                    }}
                  >
                    <BackgroundImage
                      src={category.image}
                      className="hover-scale"
                      style={{
                        height: "100%",
                        filter: "brightness(0.4)",
                      }}
                    />
                    <Box
                      pos="absolute"
                      top={0}
                      left={0}
                      right={0}
                      bottom={0}
                      p={24}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 2,
                        pointerEvents: "none",
                      }}
                    >
                      <Title
                        order={3}
                        c="white"
                        ta="center"
                        fz={28}
                        fw={400}
                        style={{
                          letterSpacing: "2px",
                          textShadow: "none",
                        }}
                      >
                        {category.name.toLocaleUpperCase("tr-TR")}
                      </Title>
                    </Box>
                  </Box>
                </motion.div>
              </Carousel.Slide>
            ))}
          </Carousel>
        )}
      </Container>

      <Box bg="#f8f9fa" pt={20} pb={{ base: 60, md: 100 }}>
        <Container size="xl">
          <Box
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "40px",
              flexWrap: "wrap",
            }}
          >
            <Box
              pos="relative"
              w={500}
              maw="100%"
              style={{
                overflow: "hidden",
                aspectRatio: "1.5/1",
                flexShrink: 0,
              }}
            >
              <video
                autoPlay
                loop
                muted
                playsInline
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              >
                <source
                  src="http://localhost:5000/videos/267244.mp4"
                  type="video/mp4"
                />
              </video>
            </Box>

            <Box
              px={{ base: "md", md: "lg" }}
              maw={600}
              style={{ textAlign: "left", flex: "0 1 auto" }}
            >
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <Title
                  order={2}
                  mb="lg"
                  style={{
                    fontSize: "clamp(28px, 5vw, 42px)",
                    letterSpacing: "2px",
                  }}
                >
                  KENDİNİ KEŞFET
                </Title>
                <Text
                  size="lg"
                  mb="xl"
                  fw={300}
                  lh={1.8}
                  style={{ letterSpacing: "0.5px" }}
                >
                  Modanın geçici akımları yerine, stilin kalıcılığına
                  odaklanıyoruz. Koleksiyonlarımız; nitelikli dokuları modern
                  bir disiplinle bir araya getirerek kişisel tarzınıza eşlik
                  ediyor. Stil, sadece bir tercih değil, bir duruş ifadesidir.
                  Kendinizi yansıtan zamansız çizgileri keşfetmeniz için
                  tasarlıyoruz.
                </Text>
              </motion.div>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
