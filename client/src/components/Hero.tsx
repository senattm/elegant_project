import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Box, Title, Text, Group, Center } from "@mantine/core";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <Box pos="relative" h="100vh" style={{ overflow: "hidden" }}>
      
      <Box
        pos="absolute"
        inset={0}
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1549439602-43ebca2327af?q=80&w=1920&auto=format&fit=crop')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: "rgba(0,0,0,0.40)",
          backgroundBlendMode: "darken"
        }}
      />

      <Center pos="relative" h="100%">
        <Box ta="center" px="xl">
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <Title
              order={1}
              c="white"
              mb="xl"
              style={{
                fontFamily: "Playfair Display, serif",
                fontSize: "clamp(3rem, 7vw, 6rem)",
                fontWeight: 400,
                letterSpacing: "0.05em",
              }}
            >
              Zamansız Zarafet
            </Title>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
          >
            <Text size="xl" c="white" mb={40} style={{ letterSpacing: "0.05em" }}>
              İkonik parçalar, unutulmaz anlar
            </Text>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
          >
            <Group justify="center" gap="md">
              
              <Box
                component="button"
                onClick={() => navigate("/shop")}
                style={{
                  padding: "16px 40px",
                  letterSpacing: "0.02em",
                  backgroundColor: "#000",
                  color: "#fff",
                  border: "none",
                  borderRadius: 0,
                  cursor: "pointer",
                  transition: "all 0.3s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#333")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#000")}
              >
                Kategorileri İncele
              </Box>

              <Box
                component="button"
                onClick={() => navigate("/shop")}
                style={{
                  padding: "14px 38px",
                  fontWeight: 500,
                  letterSpacing: "0.02em",
                  backgroundColor: "transparent",
                  color: "#fff",
                  border: "2px solid white",
                  borderRadius: 0,
                  cursor: "pointer",
                  transition: "all 0.3s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#fff";
                  e.currentTarget.style.color = "#000";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#fff";
                }}
              >
                Ürünleri Görüntüle
              </Box>

            </Group>
          </motion.div>

        </Box>
      </Center>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        style={{
          position: "absolute",
          bottom: 40,
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8
          }}
        >
          <Text c="white" size="sm" style={{ letterSpacing: "0.2em" }}>
            KAYDIR
          </Text>

          <svg
            stroke="white"
            width={24}
            height={24}
          >
            <path
              d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3"
            />
          </svg>
        </motion.div>
      </motion.div>
    </Box>
  );
};

export default Hero;
