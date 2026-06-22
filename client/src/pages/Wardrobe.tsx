import { useEffect, useState, useMemo } from "react";
import { Container, Title, Text, Grid, Image, Paper, Box, Button, Group, Stack, Center, Loader, Modal, Badge, SimpleGrid, UnstyledButton, Tabs, rem } from "@mantine/core";
import { IconArrowLeft, IconShoppingBag, IconClothesRack, IconSparkles, IconLayoutGrid } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useOrders } from "../store/hooks/useOrders";
import { getImageUrl } from "../utils/imageUrl";
import { motion } from "framer-motion";
import { useAtom } from "jotai";
import { isAuthenticatedAtom } from "../store/atoms";
import { productsApi, pythonApi } from "../api/client";
import { useDisclosure } from "@mantine/hooks";
import { productActionButtonStyles, roleLabelStyle } from "../theme";
import { navigateToStore } from "../utils/navigation";
import { outfitRoleLabel } from "../utils/outfitRoleLabels";
import { uniqueWardrobeItemsFromOrders } from "../utils/wardrobeItems";

type CirItem = {
  id: number;
  name: string;
  category: string;
  image_url: string;
};

const WardrobeCard = ({ product, handleGetRecommendations }: any) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Box
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      pos="relative"
      mb="xl"
    >
      <Box pos="relative" style={{ overflow: "hidden" }}>
        <Box
          style={{ aspectRatio: "2/3", backgroundColor: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}
          onClick={() => handleGetRecommendations(product)}
        >
          <Image src={product.image} fit="cover" h="100%" w="100%" />
        </Box>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: 12,
            backgroundColor: "rgba(255,255,255,0.98)",
            zIndex: 35,
          }}
        >
          <Button
            fullWidth
            size="sm"
            bg="black"
            radius={0}
            onClick={(e) => { e.stopPropagation(); handleGetRecommendations(product); }}
            styles={productActionButtonStyles}
          >
            KOMBİNLE
          </Button>
        </motion.div>
      </Box>

      <Box
        pt="xs"
        style={{ cursor: "pointer" }}
        onClick={() => handleGetRecommendations(product)}
      >
        <Text size="sm" c="gray.7" mb={4} truncate="end">
          {product.name}
        </Text>
      </Box>
    </Box>
  );
};

const Wardrobe = () => {
  const navigate = useNavigate();
  const { getUserOrders } = useOrders();
  const [isAuthenticated] = useAtom(isAuthenticatedAtom);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recLoading, setRecLoading] = useState(false);
  const [heroOutfit, setHeroOutfit] = useState<Record<string, any>>({});
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [cirItems, setCirItems] = useState<CirItem[]>([]);
  const [cirLoading, setCirLoading] = useState(false);
  const [cirError, setCirError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetch = async () => {
      if (isAuthenticated) {
        try {
          const orders = await getUserOrders();
          setProducts(uniqueWardrobeItemsFromOrders(orders));
        } catch (error) {
          console.error("Dolap verileri yüklenemedi:", error);
        }
      }
      setLoading(false);
    };
    fetch();
  }, [isAuthenticated, getUserOrders]);

  const [selectedCategory, setSelectedCategory] = useState<string>("TÜMÜ");

  const uniqueCategories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    return ["TÜMÜ", ...Array.from(cats)].filter(Boolean);
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "TÜMÜ") return products;
    return products.filter((p) => p.category === selectedCategory);
  }, [products, selectedCategory]);

  const handleGetRecommendations = async (product: any) => {
    setSelectedProduct(product);
    setRecLoading(true);
    setCirLoading(true);
    setHeroOutfit({});
    setCirItems([]);
    setCirError(null);
    open();

    productsApi.getRecommendations(product.id)
      .then((response) => {
        setHeroOutfit(response.data.heroOutfit || {});
      })
      .catch((err) => console.error("Kural tabanlı öneri hatası:", err))
      .finally(() => setRecLoading(false));

    pythonApi.getComplement([product.id], 8)
      .then((res) => {
        const detail: string = res.data?.detail ?? "";
        if (detail.startsWith("__loading__")) {
          setCirError("__indexing__");
        } else {
          setCirItems(
            (res.data.items || []).map(({ id, name, category, image_url }) => ({
              id,
              name,
              category,
              image_url,
            })),
          );
        }
      })
      .catch((err) => {
        console.error("Tamamlayıcı öneri hatası:", err);
        const msg: string = err?.response?.data?.detail ?? "";
        if (msg.startsWith("__loading__") || msg.includes("indeksleniyor") || msg.includes("yükleniyor")) {
          setCirError("__indexing__");
        } else if (msg.startsWith("__non_outfit__")) {
          setCirError("__non_outfit__");
        } else {
          setCirError("Öneriler yüklenemedi. Lütfen daha sonra tekrar deneyin.");
        }
      })
      .finally(() => setCirLoading(false));
  };

  const renderOutfitGrid = (outfit: Record<string, any>, keyPrefix: string) => (
    <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }} spacing="xl">
      {Object.entries(outfit).map(([role, item]) => {
        const isOwned = products.some((p: any) => p.id === item.id);
        return (
          <Stack key={`${keyPrefix}-${role}`} align="flex-start" gap="sm">
            <Paper
              radius={0}
              p={0}
              bg="white"
              style={{
                width: "100%",
                aspectRatio: "3/4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                overflow: "hidden",
                position: "relative",
              }}
              onClick={() => {
                close();
                navigate(`/product/${item.id}`);
              }}
            >
              {isOwned && (
                <Badge
                  bg="rgba(0,0,0,0.8)"
                  c="white"
                  radius={0}
                  size="xs"
                  style={{
                    position: "absolute",
                    top: 10,
                    left: 10,
                    zIndex: 10,
                    letterSpacing: "1px",
                    fontSize: "9px",
                  }}
                >
                  DOLABINIZDA
                </Badge>
              )}
              <Image src={getImageUrl(item.images?.[0])} fit="cover" h="100%" w="100%" />
            </Paper>
            <Box w="100%">
              <Text size="10px" c="dimmed" mb={2} style={roleLabelStyle}>
                {outfitRoleLabel(role)}
              </Text>
              <Text size="sm" c="gray.7" mb={4} truncate="end">
                {item.name}
              </Text>
              <Group justify="space-between" align="center" mt={4}>
                <Text size="md" fw={600} c="black">
                  {typeof item.price === "number"
                    ? item.price.toFixed(2)
                    : parseFloat(item.price || "0").toFixed(2)}{" "}
                  TL
                </Text>
                {!isOwned && (
                  <Text
                    size="11px"
                    fw={600}
                    c="black"
                    style={{ textDecoration: "underline", cursor: "pointer", letterSpacing: "1px" }}
                    onClick={() => {
                      close();
                      navigate(`/product/${item.id}`);
                    }}
                  >
                    SATIN AL
                  </Text>
                )}
              </Group>
            </Box>
          </Stack>
        );
      })}
    </SimpleGrid>
  );

  if (loading) {
    return (
      <Center h="60vh">
        <Loader color="black" type="dots" />
      </Center>
    );
  }

  return (
    <Box py={60} bg="white" mih="100vh">
      <Container size="xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Group gap="xs" mb={40} style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
            <IconArrowLeft size={18} stroke={1.5} />
            <Text fw={500} size="xs" style={{ letterSpacing: "1px" }}>GERİ DÖN</Text>
          </Group>

          <Group justify="space-between" align="flex-end" mb="xl">
            <Title order={1} fw={400} style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)" }}>
              Dolabım <Text component="span" c="dimmed" fs="italic" fw={300}>/ koleksiyon</Text>
            </Title>
            <Group gap="xl" align="center" style={{ paddingBottom: "8px" }}>
              <Stack gap={0} align="center">
                <Text fz={28} fw={500} ff='"Playfair Display", serif'>{products.length}</Text>
                <Text fz={10} c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: "2px" }}>PARÇA</Text>
              </Stack>
            </Group>
          </Group>
          <Box h={1} bg="gray.2" mb="xl" w="100%" />

          <Group gap="md" mb={40} style={{ overflowX: "auto", flexWrap: "nowrap" }} pb={10}>
            {uniqueCategories.map((filter) => (
              <Button
                key={filter as string}
                variant="outline"
                radius="md"
                size="md"
                onClick={() => setSelectedCategory(filter as string)}
                style={{
                  borderColor: selectedCategory === filter ? "black" : "#e0e0e0",
                  color: selectedCategory === filter ? "black" : "#333",
                  fontWeight: 500,
                  letterSpacing: "1px",
                  backgroundColor: selectedCategory === filter ? "#f8f9fa" : "transparent",
                  flexShrink: 0,
                }}
              >
                {filter as string}
              </Button>
            ))}
          </Group>
        </motion.div>

        {!isAuthenticated || products.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Center py={100}>
              <Stack align="center" gap="xl" ta="center">
                <Box p={40} bg="#fafafa" style={{ borderRadius: "50%", border: "1px solid #eee" }}>
                  <IconClothesRack size={60} stroke={1} color="#999" />
                </Box>
                <Box>
                  <Title order={2} fz={28} fw={400} mb="xs">Dolabınızda henüz parça yok</Title>
                  <Text c="dimmed" size="md" mb="xl">Koleksiyonumuzdaki zarif parçalarla dolabınızı oluşturmaya başlayın.</Text>
                </Box>
                <Button
                  radius={0}
                  h={50}
                  bg="black"
                  color="white"
                  px={40}
                  onClick={() => navigateToStore(navigate)}
                  leftSection={<IconShoppingBag size={18} />}
                  style={{ letterSpacing: "1px" }}
                >
                  HEMEN KEŞFET
                </Button>
              </Stack>
            </Center>
          </motion.div>
        ) : (
          <Box mt="xl">
            <Grid gutter={20}>
              {filteredProducts.map((product, idx) => (
                <Grid.Col key={`${product.id}-${idx}`} span={{ base: 6, sm: 6, md: 4, lg: 3 }}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                    style={{ height: "100%" }}
                  >
                    <WardrobeCard product={product} handleGetRecommendations={handleGetRecommendations} />
                  </motion.div>
                </Grid.Col>
              ))}
            </Grid>
          </Box>
        )}
      </Container>

      <Modal
        opened={opened}
        onClose={close}
        size="90%"
        radius={0}
        padding={0}
        withCloseButton={false}
        styles={{
          content: { backgroundColor: "#fcfcfc" },
        }}
      >
        <Box p={50}>
          <Group justify="space-between" mb={50} align="flex-end" wrap="wrap" gap="md">
            <Title order={2} fz={32} fw={400}>Sizin İçin Seçtiklerimiz</Title>
            <UnstyledButton onClick={close} style={{ opacity: 0.5 }}>
              <Text size="sm" fw={600} style={{ letterSpacing: "1px" }}>KAPAT</Text>
            </UnstyledButton>
          </Group>

          <Grid gutter={60} align="flex-start">
            <Grid.Col span={{ base: 12, md: 4, lg: 3 }}>
              <Stack align="flex-start" gap="md">
                <Text c="dimmed" style={roleLabelStyle}>SEÇİLEN PARÇA</Text>
                <Paper
                  radius={0}
                  p={0}
                  bg="white"
                  style={{
                    width: "100%",
                    aspectRatio: "3/4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  <Image src={selectedProduct?.image} fit="cover" h="100%" w="100%" />
                </Paper>
                <Box w="100%">
                  <Text size="sm" c="gray.7" mb={4} truncate="end">{selectedProduct?.name}</Text>
                  <Text size="md" fw={600} c="black">
                    {typeof selectedProduct?.price === "number"
                      ? selectedProduct.price.toFixed(2)
                      : parseFloat(selectedProduct?.price || "0").toFixed(2)}{" "}
                    TL
                  </Text>
                </Box>
              </Stack>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 8, lg: 9 }}>
              <Tabs
                defaultValue="cir"
                variant="unstyled"
                styles={{
                  tab: {
                    padding: `${rem(8)} ${rem(16)}`,
                    fontSize: rem(11),
                    fontWeight: 600,
                    letterSpacing: rem(1.5),
                    color: "#999",
                    borderBottom: "2px solid transparent",
                    "&[dataSelected]": {
                      color: "#111",
                      borderBottomColor: "#111",
                    },
                  },
                  list: { borderBottom: "1px solid #eee", marginBottom: rem(28) },
                }}
              >
                <Tabs.List>
                  <Tabs.Tab
                    value="cir"
                    leftSection={<IconSparkles size={13} />}
                    style={{ fontSize: rem(11), letterSpacing: rem(1.5), fontWeight: 600 }}
                  >
                    TAMAMLAYICILAR
                  </Tabs.Tab>
                  <Tabs.Tab
                    value="rule"
                    leftSection={<IconLayoutGrid size={13} />}
                    style={{ fontSize: rem(11), letterSpacing: rem(1.5), fontWeight: 600 }}
                  >
                    KOMBİN
                  </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="cir">
                  {cirLoading ? (
                    <Center h={320}>
                      <Stack align="center" gap="md">
                        <Loader color="black" type="bars" />
                        <Text size="sm" c="dimmed" ta="center">
                          Tamamlayıcı parçalar hazırlanıyor…
                        </Text>
                        <Text size="xs" c="dimmed">İlk açılışta biraz sürebilir.</Text>
                      </Stack>
                    </Center>
                  ) : cirError === "__indexing__" ? (
                    <Box py={60} ta="center">
                      <Loader color="gray" size="sm" mb="md" />
                      <Text size="sm" fw={500} c="dimmed">Öneriler hazırlanıyor…</Text>
                      <Text size="xs" c="dimmed" mt={4}>
                        Birkaç saniye içinde hazır olacak. Tekrar tıklayın.
                      </Text>
                    </Box>
                  ) : cirError === "__non_outfit__" ? (
                    <Box py={60} ta="center">
                      <Text size="xl" mb="sm">🌙</Text>
                      <Text size="sm" fw={500}>Bu ürün için öneri yapılamıyor.</Text>
                      <Text size="xs" c="dimmed" mt={4}>
                        İç giyim ve ev kıyafetleri bu kapsamda değerlendirilmiyor.
                      </Text>
                    </Box>
                  ) : cirError ? (
                    <Box py={40}>
                      <Text c="red" size="sm">{cirError}</Text>
                    </Box>
                  ) : cirItems.length === 0 ? (
                    <Box py={40}>
                      <Text c="dimmed">Bu parça için tamamlayıcı ürün bulunamadı.</Text>
                    </Box>
                  ) : (
                    <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }} spacing="xl">
                      {cirItems.map((item) => (
                        <Stack key={item.id} align="flex-start" gap="sm">
                          <Paper
                            radius={0}
                            p={0}
                            bg="white"
                            style={{
                              width: "100%",
                              aspectRatio: "3/4",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              overflow: "hidden",
                              cursor: "pointer",
                            }}
                            onClick={() => { close(); navigate(`/product/${item.id}`); }}
                          >
                            <Image
                              src={item.image_url || "/placeholder.jpg"}
                              fit="cover"
                              h="100%"
                              w="100%"
                            />
                          </Paper>
                          <Box w="100%">
                            <Text size="10px" c="dimmed" mb={2} style={roleLabelStyle}>
                              {item.category}
                            </Text>
                            <Text size="sm" c="gray.7" mb={4} truncate="end">
                              {item.name}
                            </Text>
                            <Text
                              size="11px"
                              fw={600}
                              c="black"
                              style={{ textDecoration: "underline", cursor: "pointer", letterSpacing: "1px" }}
                              onClick={() => { close(); navigate(`/product/${item.id}`); }}
                            >
                              SATIN AL
                            </Text>
                          </Box>
                        </Stack>
                      ))}
                    </SimpleGrid>
                  )}
                </Tabs.Panel>

                <Tabs.Panel value="rule">
                  {recLoading ? (
                    <Center h={320}>
                      <Stack align="center" gap="lg">
                        <Loader color="black" type="bars" />
                        <Text size="sm" fw={500} c="dimmed" ta="center">
                          Sizin için en uyumlu görünümü<br />tasarlıyoruz…
                        </Text>
                      </Stack>
                    </Center>
                  ) : Object.keys(heroOutfit).length > 0 ? (
                    renderOutfitGrid(heroOutfit, "single")
                  ) : (
                    <Box py={40}>
                      <Text c="dimmed">Bu parça için henüz tamamlayıcı bir öneri bulunamadı.</Text>
                    </Box>
                  )}
                </Tabs.Panel>
              </Tabs>
            </Grid.Col>
          </Grid>
        </Box>
      </Modal>
    </Box>
  );
};

export default Wardrobe;
