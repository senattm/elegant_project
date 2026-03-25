import { useEffect, useState } from "react";
import { Container, Title, Text, Grid, Image, Paper, Box, Button, Group, Stack, Center, Loader } from "@mantine/core";
import { IconSparkles, IconArrowLeft, IconShoppingBag, IconClothesRack, IconHeart } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useOrders } from "../store/hooks/useOrders";
import { getImageUrl } from "../utils/imageUrl";
import { motion } from "framer-motion";
import { useAtom } from "jotai";
import { isAuthenticatedAtom } from "../store/atoms";

const Wardrobe = () => {
    const navigate = useNavigate();
    const { getUserOrders } = useOrders();
    const [isAuthenticated] = useAtom(isAuthenticatedAtom);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        const fetch = async () => {
            if (isAuthenticated) {
                try {
                    const orders = await getUserOrders();
                    const items = orders.flatMap((o: any) => o.items).map((i: any) => ({
                        id: i.productId,
                        name: i.productName,
                        image: getImageUrl(i.productImages?.[0]),
                        category: i.category || 'Zamansız Parça'
                    }));

                    const unique = Array.from(new Map(items.map((p: any) => [p.id, p])).values());
                    setProducts(unique);
                } catch (error) {
                    console.error("Dolap verileri yüklenemedi:", error);
                }
            }
            setLoading(false);
        };
        fetch();
    }, [isAuthenticated, getUserOrders]);

    if (loading) {
        return (
            <Center h="60vh">
                <Loader color="black" type="dots" />
            </Center>
        );
    }

    return (
        <Box py={80} bg="white" mih="100vh" style={{ fontFamily: 'Montserrat, sans-serif', overflow: "visible" }}>
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

                    <Box mb={50}>
                        <Group gap="xs" mb={4}>
                            <IconHeart size={24} fill="#f8e1e7" color="#e0a6b2" />
                            <Text fw={700} fz={22} c="#e0a6b2" style={{ letterSpacing: "2px" }}>SİZE ÖZEL</Text>
                        </Group>
                        <Title order={1} fz={32} fw={500} style={{ letterSpacing: "1px" }}>Dolabım</Title>
                    </Box>
                </motion.div>

                {!isAuthenticated || products.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <Center py={100}>
                            <Stack align="center" gap="xl" ta="center">
                                <Box p={40} bg="#fff5f7" style={{ borderRadius: "50%", border: "2px dashed #f8e1e7" }}>
                                    <IconClothesRack size={60} stroke={1} color="#e0a6b2" />
                                </Box>
                                <Box>
                                    <Title order={2} fz={28} fw={600} mb="xs">Dolabınızda henüz parça yok mu? ✨</Title>
                                    <Text c="dimmed" size="lg" mb="xl">Koleksiyonumuzdaki en trend parçalarla dolabınızı canlandırmaya başlayın!</Text>
                                </Box>
                                <Button
                                    radius={0}
                                    h={60}
                                    bg="black"
                                    color="white"
                                    px={50}
                                    size="lg"
                                    onClick={() => navigate("/store")}
                                    leftSection={<IconShoppingBag size={20} />}
                                    style={{ letterSpacing: "1px" }}
                                >
                                    HEMEN KEŞFET
                                </Button>
                            </Stack>
                        </Center>
                    </motion.div>
                ) : (
                    <Grid gutter={40}>
                        {products.map((product, idx) => (
                            <Grid.Col key={`${product.id}-${idx}`} span={{ base: 12, sm: 6, lg: 4 }}>
                                <motion.div
                                    whileHover={{ y: -10 }}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                                >
                                    <Paper
                                        radius={0}
                                        bg="#ffffff"
                                        p={30}
                                        style={{ border: "none", boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)" }}
                                    >
                                        <Stack gap="xl">
                                            <Box style={{
                                                aspectRatio: "1/1",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                padding: 20,
                                                background: "white",
                                                border: "none"
                                            }}>
                                                <Image
                                                    src={product.image}
                                                    fit="contain"
                                                    h="100%"
                                                    w="100%"
                                                />
                                            </Box>

                                            <Box>
                                                <Text fz={11} fw={700} tt="uppercase" c="#e0a6b2" mb={4} style={{ letterSpacing: "2px" }}>{product.category}</Text>
                                                <Title order={3} fz={24} fw={700} style={{ letterSpacing: "0.5px" }}>{product.name}</Title>
                                            </Box>

                                            <Paper
                                                bg="#fff5f7"
                                                p="xl"
                                                radius={0}
                                                style={{ border: "2px dashed #f8e1e7" }}
                                            >
                                                <Stack gap="md" align="center">
                                                    <Text fz="sm" ta="center" fw={500} c="gray.8">
                                                        Bu harika parça için size özel bir önerimiz var! ✨
                                                    </Text>
                                                    <Button
                                                        variant="filled"
                                                        color="black"
                                                        radius={0}
                                                        fullWidth
                                                        size="md"
                                                        leftSection={<IconSparkles size={18} />}
                                                        style={{ height: 50, fontWeight: 700, letterSpacing: "1px" }}
                                                        onClick={() => navigate(`/product/${product.id}`)}
                                                    >
                                                        STİL ÖNERİMİZ 🔥
                                                    </Button>
                                                </Stack>
                                            </Paper>
                                        </Stack>
                                    </Paper>
                                </motion.div>
                            </Grid.Col>
                        ))}
                    </Grid>
                )}
            </Container>
        </Box>
    );
};

export default Wardrobe;
