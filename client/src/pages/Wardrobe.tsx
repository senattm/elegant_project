import { useEffect, useState, useMemo } from "react";
import { Container, Title, Text, Grid, Image, Paper, Box, Button, Group, Stack, Center, Loader, Modal, Badge, SimpleGrid, UnstyledButton } from "@mantine/core";
import { IconArrowLeft, IconShoppingBag, IconClothesRack } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useOrders } from "../store/hooks/useOrders";
import { getImageUrl } from "../utils/imageUrl";
import { motion } from "framer-motion";
import { useAtom } from "jotai";
import { isAuthenticatedAtom } from "../store/atoms";
import { productsApi } from "../api/client";
import { useDisclosure } from "@mantine/hooks";
import { productActionButtonStyles, roleLabelStyle, smallLabelStyle } from "../theme";
import { navigateToStore } from "../utils/navigation";
import { outfitRoleLabel } from "../utils/outfitRoleLabels";
import { uniqueWardrobeItemsFromOrders } from "../utils/wardrobeItems";

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

    const [selectedCategory, setSelectedCategory] = useState<string>('TÜMÜ');

    const uniqueCategories = useMemo(() => {
        const cats = new Set(products.map(p => p.category));
        return ['TÜMÜ', ...Array.from(cats)].filter(Boolean);
    }, [products]);

    const filteredProducts = useMemo(() => {
        if (selectedCategory === 'TÜMÜ') return products;
        return products.filter(p => p.category === selectedCategory);
    }, [products, selectedCategory]);

    const handleGetRecommendations = async (product: any) => {
        setSelectedProduct(product);
        setRecLoading(true);
        setHeroOutfit({});
        open();
        try {
            const response = await productsApi.getRecommendations(product.id);
            const data = response.data;
            setHeroOutfit(data.heroOutfit || {});
        } catch (error) {
            console.error("Öneriler yüklenemedi:", error);
        } finally {
            setRecLoading(false);
        }
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
                        <Title order={1} fw={400} style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)' }}>
                            Dolabım <Text component="span" c="dimmed" fs="italic" fw={300}>/ koleksiyon</Text>
                        </Title>
                        <Group gap="xl" align="center" style={{ paddingBottom: '8px' }}>
                            <Stack gap={0} align="center">
                                <Text fz={28} fw={500} ff='"Playfair Display", serif'>{products.length}</Text>
                                <Text fz={10} c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: '2px' }}>PARÇA</Text>
                            </Stack>
                        </Group>
                    </Group>
                    <Box h={1} bg="gray.2" mb="xl" w="100%" />

                    <Group gap="md" mb={40} style={{ overflowX: 'auto', flexWrap: 'nowrap' }} pb={10}>
                        {uniqueCategories.map((filter) => (
                            <Button 
                                key={filter as string} 
                                variant="outline" 
                                radius="md" 
                                size="md"
                                onClick={() => setSelectedCategory(filter as string)}
                                style={{ 
                                    borderColor: selectedCategory === filter ? 'black' : '#e0e0e0',
                                    color: selectedCategory === filter ? 'black' : '#333',
                                    fontWeight: 500,
                                    letterSpacing: '1px',
                                    backgroundColor: selectedCategory === filter ? '#f8f9fa' : 'transparent',
                                    flexShrink: 0
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
                                        style={{ height: '100%' }}
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
                    content: { backgroundColor: '#fcfcfc' }
                }}
            >
                <Box p={50}>
                    <Group justify="space-between" mb={50} align="flex-end" wrap="wrap" gap="md">
                        <Stack gap="md">
                            <Title order={2} fz={32} fw={400}>Sizin İçin Seçtiklerimiz</Title>
                            <Text size="xs" c="dimmed" style={smallLabelStyle}>
                                CLIP · ürün fotoğrafı (-1)
                            </Text>
                        </Stack>
                        <UnstyledButton onClick={close} style={{ opacity: 0.5 }}>
                            <Text size="sm" fw={600} style={{ letterSpacing: "1px" }}>KAPAT</Text>
                        </UnstyledButton>
                    </Group>

                    {recLoading ? (
                        <Center h={400}>
                            <Stack align="center" gap="lg">
                                <Loader color="black" type="bars" />
                                <Text size="sm" fw={500} c="dimmed" ta="center">Sizin için en uyumlu görünümü<br />tasarlıyoruz...</Text>
                            </Stack>
                        </Center>
                    ) : (
                        <Grid gutter={60} align="flex-start">
                            <Grid.Col span={{ base: 12, md: 4, lg: 3 }}>
                                <Stack align="flex-start" gap="md">
                                    <Text c="dimmed" style={roleLabelStyle}>SEÇİLEN PARÇA</Text>
                                    <Paper radius={0} p={0} bg="white"
                                        style={{
                                            width: "100%",
                                            aspectRatio: "3/4",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            overflow: "hidden"
                                        }}
                                    >
                                        <Image src={selectedProduct?.image} fit="cover" h="100%" w="100%" />
                                    </Paper>
                                    <Box w="100%">
                                        <Text size="sm" c="gray.7" mb={4} truncate="end">{selectedProduct?.name}</Text>
                                        <Text size="md" fw={600} c="black">{typeof selectedProduct?.price === 'number' ? selectedProduct.price.toFixed(2) : parseFloat(selectedProduct?.price || '0').toFixed(2)} TL</Text>
                                    </Box>
                                </Stack>
                            </Grid.Col>

                            <Grid.Col span={{ base: 12, md: 8, lg: 9 }}>
                                <Stack gap="xl">
                                    <Text c="dimmed" style={roleLabelStyle}>
                                        TAM KOMBİN PLANI · CLIP
                                    </Text>
                                    {Object.keys(heroOutfit).length > 0 ? (
                                        renderOutfitGrid(heroOutfit, "single")
                                    ) : (
                                        <Box py={40}>
                                            <Text c="dimmed">Bu parça için henüz tamamlayıcı bir öneri bulunamadı.</Text>
                                        </Box>
                                    )}
                                </Stack>
                            </Grid.Col>
                        </Grid>
                    )}
                </Box>
            </Modal>
        </Box>
    );
};

export default Wardrobe;
