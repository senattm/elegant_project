import { useEffect, useState } from "react";
import { Box, Container, Text, Title } from "@mantine/core";
import { IconArrowRight, IconHanger2 } from "@tabler/icons-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useOrders } from "../../store/hooks/useOrders";
import { useAtom } from "jotai";
import { isAuthenticatedAtom } from "../../store/atoms";
import { getImageUrl, getProductImageBackground, isPolyvoreProduct } from "../../utils/imageUrl";
import { uniqueWardrobeItemsFromOrders } from "../../utils/wardrobeItems";
import { getServerUrl } from "../../utils/serverUrl";
import { sectionTitleStyle, smallLabelStyle } from "../../theme";

type WardrobeItem = {
  id: number;
  image: string;
  name: string;
  imagePath?: string;
  source?: string | null;
};

const defaultItems: WardrobeItem[] = [
  { id: 1, image: getImageUrl("101-0.jpg"), name: "Siyah Saten Elbise" },
  { id: 2, image: getImageUrl("104-0.jpg"), name: "Oversize Blazer" },
  { id: 3, image: getImageUrl("110-0.jpg"), name: "Deri Topuklu Ayakkabı" },
];

const highlights = [
  { label: "Parçanı seç", desc: "Dolabından bir ürünle başla" },
  { label: "Stilini tamamla", desc: "Üst, alt ve ayakkabı bir arada" },
];

const WardrobePiecesPanel = ({
  items,
  itemCount,
  onOpen,
}: {
  items: WardrobeItem[];
  itemCount: number;
  onOpen: () => void;
}) => (
  <Box
    onClick={onOpen}
    style={{
      cursor: "pointer",
      background: "rgba(255,255,255,0.85)",
      border: "1px solid rgba(0,0,0,0.08)",
      boxShadow: "0 24px 56px rgba(0,0,0,0.07)",
      padding: "24px 22px 22px",
    }}
  >
    <Box mb={20} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
      <Text style={{ ...smallLabelStyle, fontSize: 9, color: "rgba(0,0,0,0.35)" }}>
        Dolabınızdaki parçalar
      </Text>
      {itemCount > 0 && (
        <Text c="rgba(0,0,0,0.4)" style={{ ...smallLabelStyle, fontSize: 9 }}>
          {itemCount} parça
        </Text>
      )}
    </Box>

    <Box
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 2,
        background: "rgba(0,0,0,0.06)",
      }}
    >
      {items.map((item, index) => {
        const imageRef = item.imagePath ?? item.image;
        const polyvore = isPolyvoreProduct(item.source, imageRef);

        return (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: index * 0.08 }}
          viewport={{ once: true }}
          whileHover={{ y: -4 }}
        >
          <Box
            className="wardrobe-card-light"
            style={{
              position: "relative",
              aspectRatio: "3/4",
              overflow: "hidden",
              background: getProductImageBackground(imageRef, item.source) ?? "#fff",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <Box
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url('${item.image}')`,
                backgroundSize: polyvore ? "contain" : "cover",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center center",
              }}
            />
            <Box
              p="10px 8px"
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                background: "linear-gradient(transparent, rgba(255,255,255,0.95) 35%)",
              }}
            >
              <Text
                truncate
                ta="center"
                c="#111"
                style={{ fontSize: 9, letterSpacing: 0.8, textTransform: "uppercase" }}
              >
                {item.name}
              </Text>
            </Box>
          </Box>
        </motion.div>
        );
      })}
    </Box>

    <Text mt={16} ta="center" c="rgba(0,0,0,0.35)" style={{ ...smallLabelStyle, fontSize: 9 }}>
      Tüm dolabı gör →
    </Text>
  </Box>
);

const MyWardrobe = () => {
  const navigate = useNavigate();
  const { getUserOrders } = useOrders();
  const [isAuthenticated] = useAtom(isAuthenticatedAtom);
  const [displayItems, setDisplayItems] = useState<WardrobeItem[]>(defaultItems);
  const [itemCount, setItemCount] = useState(0);

  useEffect(() => {
    const fetchWardrobe = async () => {
      if (!isAuthenticated) return;

      try {
        const orders = await getUserOrders();
        if (!orders?.length) return;

        const unique = uniqueWardrobeItemsFromOrders(orders) as WardrobeItem[];
        if (unique.length > 0) {
          setDisplayItems(unique.slice(0, 3));
          setItemCount(unique.length);
        }
      } catch (error) {
        console.error("Dolap parçaları yüklenemedi:", error);
      }
    };

    fetchWardrobe();
  }, [isAuthenticated, getUserOrders]);

  const wardrobeBg = `${getServerUrl()}/images/wardrobe_background.jpg`;
  const goWardrobe = () => navigate("/wardrobe");

  return (
    <Box
      pos="relative"
      py={{ base: 80, md: 112 }}
      style={{
        overflow: "hidden",
        backgroundColor: "#f5f4f0",
        borderTop: "1px solid rgba(0,0,0,0.06)",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      <Box
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url('${wardrobeBg}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.12,
          pointerEvents: "none",
        }}
      />
      <motion.div
        animate={{ opacity: [0.04, 0.08, 0.04] }}
        transition={{ duration: 5, repeat: Infinity }}
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(90deg, transparent, transparent 79px, rgba(0,0,0,0.03) 80px)",
          pointerEvents: "none",
        }}
      />

      <Container size="xl" pos="relative" style={{ zIndex: 1 }}>
        <Box
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 56,
            alignItems: "center",
          }}
        >
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.75 }}
            viewport={{ once: true }}
            style={{ textAlign: "left" }}
          >
            <Box
              pl={{ base: 0, sm: 28, md: 56, lg: 88 }}
              pr={{ base: 0, md: 20 }}
              maw={520}
            >
            <Box mb={20} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Box
                style={{
                  width: 48,
                  height: 48,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid rgba(0,0,0,0.1)",
                  background: "rgba(255,255,255,0.6)",
                }}
              >
                <IconHanger2 size={24} stroke={1.2} color="#111" />
              </Box>
              <Text c="rgba(0,0,0,0.35)" style={{ fontSize: 12, letterSpacing: 5, textTransform: "uppercase" }}>
                Kişisel dolap
              </Text>
            </Box>

            <Title order={2} mb={24} c="#111" style={{ ...sectionTitleStyle, fontSize: "clamp(40px, 5.5vw, 60px)" }}>
              Dolabınız
            </Title>

            <Box
              mb={28}
              style={{
                width: 56,
                height: 1,
                background: "linear-gradient(90deg, #111, transparent)",
              }}
            />

            <Text mb={32} c="rgba(0,0,0,0.5)" style={{ fontSize: 16, lineHeight: 1.9, maxWidth: 460, letterSpacing: 0.2 }}>
              Satın aldığınız parçalar dolabınızda toplanır. Birini seçtiğinizde size uygun parçaları bir araya getirelim.
            </Text>

            <Box
              mb={36}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 2,
                background: "rgba(0,0,0,0.06)",
                maxWidth: 460,
              }}
            >
              {highlights.map((item, i) => (
                <Box
                  key={item.label}
                  p="20px 22px"
                  style={{
                    background: i === 0 ? "rgba(255,255,255,0.55)" : "#fff",
                    border: "1px solid rgba(0,0,0,0.04)",
                  }}
                >
                  <Text mb={8} style={{ ...smallLabelStyle, fontSize: 10, color: "rgba(0,0,0,0.35)" }}>
                    {item.label}
                  </Text>
                  <Text c="rgba(0,0,0,0.55)" style={{ fontSize: 13, lineHeight: 1.55 }}>
                    {item.desc}
                  </Text>
                </Box>
              ))}
            </Box>

            <motion.div whileHover={{ x: 6 }} transition={{ type: "spring", stiffness: 300 }}>
              <Box
                component="button"
                type="button"
                onClick={goWardrobe}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "16px 40px",
                  background: "#111",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 12,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  fontFamily: "inherit",
                  boxShadow: "0 14px 32px rgba(0,0,0,0.12)",
                }}
              >
                Dolabımı Gör
                <IconArrowRight size={18} stroke={1.5} />
              </Box>
            </motion.div>

            {!isAuthenticated && (
              <Text mt={22} c="rgba(0,0,0,0.35)" style={{ fontSize: 13, lineHeight: 1.65 }}>
                Giriş yapın; satın aldıklarınız dolabınızda listelensin.
              </Text>
            )}
            </Box>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            viewport={{ once: true }}
            style={{ width: "100%", minWidth: 0 }}
          >
            <WardrobePiecesPanel items={displayItems} itemCount={itemCount} onOpen={goWardrobe} />
          </motion.div>
        </Box>
      </Container>
    </Box>
  );
};

export default MyWardrobe;
