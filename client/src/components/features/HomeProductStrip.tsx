import { useNavigate } from "react-router-dom";
import { Box, Container, SimpleGrid, Text, Title } from "@mantine/core";
import { motion } from "framer-motion";
import type { Product } from "../../types";
import ProductCard from "./ProductCard";

const sectionTitleStyle = {
  fontFamily: "'Georgia', serif",
  fontWeight: 300,
  letterSpacing: "4px",
  textTransform: "uppercase" as const,
  lineHeight: 1.05,
};

type HomeProductStripProps = {
  eyebrow: string;
  title: string;
  description?: string;
  products: Product[];
  tone?: "light" | "muted";
  storeHref?: string;
};

const HomeProductStrip = ({
  eyebrow,
  title,
  description,
  products,
  tone = "light",
  storeHref = "/store",
}: HomeProductStripProps) => {
  const navigate = useNavigate();

  if (products.length === 0) return null;

  return (
    <Box
      bg={tone === "muted" ? "#f5f4f0" : "white"}
      py={{ base: 56, md: 80 }}
      style={{
        borderTop: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      <Container size="xl">
        <Box
          mb={{ base: 32, md: 44 }}
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 20,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Text mb={10} c="rgba(0,0,0,0.35)" style={{ fontSize: 11, letterSpacing: 5, textTransform: "uppercase" }}>
              {eyebrow}
            </Text>
            <Title order={2} style={{ ...sectionTitleStyle, fontSize: "clamp(26px, 4vw, 40px)" }}>
              {title}
            </Title>
            {description && (
              <Text mt={14} maw={420} c="rgba(0,0,0,0.45)" style={{ fontSize: 13, lineHeight: 1.75 }}>
                {description}
              </Text>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <Box
              component="button"
              type="button"
              onClick={() => {
                navigate(storeHref);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 24px",
                background: "transparent",
                border: "1px solid rgba(0,0,0,0.18)",
                color: "#111",
                cursor: "pointer",
                fontSize: 10,
                letterSpacing: 2,
                textTransform: "uppercase",
                fontFamily: "inherit",
              }}
            >
              Mağazaya Git
              <span>→</span>
            </Box>
          </motion.div>
        </Box>

        <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing={{ base: "md", sm: "lg" }}>
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: index * 0.06 }}
              viewport={{ once: true }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
};

export default HomeProductStrip;
