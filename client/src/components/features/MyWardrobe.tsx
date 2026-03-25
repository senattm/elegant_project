import { useEffect, useState } from "react";
import { Container, Box, Title, Text, Group, Button, Grid, Image, Paper, Stack } from "@mantine/core";
import { IconSparkles, IconArrowRight, IconClothesRack } from "@tabler/icons-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useOrders } from "../../store/hooks/useOrders";
import { useAtom } from "jotai";
import { isAuthenticatedAtom } from "../../store/atoms";
import { getImageUrl } from "../../utils/imageUrl";

const MyWardrobe = () => {
    const navigate = useNavigate();
    const { getUserOrders } = useOrders();
    const [isAuthenticated] = useAtom(isAuthenticatedAtom);

    const [displayItems, setDisplayItems] = useState([
        { id: 1, image: "http://localhost:5000/images/kategori_elbise.png", name: "Siyah Saten Elbise" },
        { id: 2, image: "http://localhost:5000/images/kategori_ceket.png", name: "Oversize Blazer" },
        { id: 3, image: "http://localhost:5000/images/kategori_ayakkabı.png", name: "Deri Topuklu Ayakkabı" },
    ]);
    const [itemCount, setItemCount] = useState(0);
    const [showBadge, setShowBadge] = useState(false);

    useEffect(() => {
        const fetchRealProducts = async () => {
            if (isAuthenticated) {
                try {
                    const orders = await getUserOrders();
                    if (orders && orders.length > 0) {
                        const products = orders.flatMap((order: any) =>
                            order.items.map((item: any) => ({
                                id: item.productId,
                                name: item.productName,
                                image: getImageUrl(item.productImages?.[0] || 'deneme.jpg')
                            }))
                        );

                        if (products.length > 0) {
                            const uniqueProducts = Array.from(new Map(products.map((p: any) => [p.id, p])).values());
                            setDisplayItems(uniqueProducts.slice(0, 3) as any);
                            setItemCount(uniqueProducts.length);
                            setShowBadge(true);
                        }
                    }
                } catch (error) {
                    console.error("Dolap ürünleri yüklenemedi:", error);
                }
            }
        };
        fetchRealProducts();
    }, [isAuthenticated, getUserOrders]);

    return (
        <Box py={100} bg="white" style={{ borderTop: "1px solid #f1f1f1" }}>
            <Container size="xl">
                <Grid gutter={50} align="center">
                    <Grid.Col span={{ base: 12, md: 5 }}>
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                        >
                            <Group gap="xs" mb="md">
                                <IconClothesRack size={24} stroke={1.5} />
                                <Text fw={500} style={{ letterSpacing: "1px" }}>DOLABIM</Text>
                            </Group>

                            <Title order={2} fz={40} mb="xl" style={{ letterSpacing: "1px" }}>
                                STİLİNİZİ <br /> YENİDEN KURGULAYIN
                            </Title>

                            <Text size="lg" c="dimmed" mb={40} lh={1.8} fw={300}>
                                Aldığınız her parça, hikayenizin bir parçası. Dolabınızdaki ürünleri bir araya getirelim ve size özel zamansız kombin önerileri sunalım.
                            </Text>

                            <Group gap="md">
                                <Button
                                    variant="filled"
                                    color="black"
                                    size="lg"
                                    radius={0}
                                    onClick={() => navigate("/wardrobe")}
                                    rightSection={<IconSparkles size={18} />}
                                    style={{ height: 54, paddingLeft: 30, paddingRight: 30 }}
                                >
                                    KOMBİN ÖNERİSİ AL
                                </Button>
                                <Button
                                    variant="subtle"
                                    color="gray"
                                    size="lg"
                                    radius={0}
                                    onClick={() => navigate("/wardrobe")}
                                    rightSection={<IconArrowRight size={18} />}
                                    style={{ height: 54 }}
                                >
                                    TÜMÜNÜ GÖR
                                </Button>
                            </Group>
                        </motion.div>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, md: 7 }}>
                        <Box pos="relative">
                            <Grid gutter="md" pos="relative" style={{ zIndex: 1 }}>
                                {displayItems.map((item, index) => (
                                    <Grid.Col key={`${item.id}-${index}`} span={index === 0 ? 12 : 6}>
                                        <motion.div
                                            whileHover={{ scale: 1.02 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <Paper
                                                radius={0}
                                                p={index === 0 ? 60 : 40}
                                                bg="#fcfcfc"
                                                style={{
                                                    border: "1px solid #f1f1f1",
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center"
                                                }}
                                                onClick={() => navigate("/wardrobe")}
                                            >
                                                <Box pos="relative" style={{ aspectRatio: "1/1", width: "100%", textAlign: "center" }}>
                                                    <Image
                                                        src={item.image}
                                                        alt={item.name}
                                                        fit="contain"
                                                        h="100%"
                                                        w="100%"
                                                        style={{ filter: "grayscale(2%) brightness(1)" }}
                                                    />
                                                    <Box
                                                        pos="absolute"
                                                        bottom={-25}
                                                        left={0}
                                                        right={0}
                                                        ta="center"
                                                    >
                                                        <Text fz={10} tt="uppercase" c="dimmed" style={{ letterSpacing: "1px" }}>
                                                            {showBadge ? 'Dolabınızdan' : 'Son Alınanlar'}
                                                        </Text>
                                                        <Text fz="xs" fw={400} c="black">{item.name}</Text>
                                                    </Box>
                                                </Box>
                                            </Paper>
                                        </motion.div>
                                    </Grid.Col>
                                ))}
                            </Grid>

                            {showBadge && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    whileInView={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 100, delay: 0.8 }}
                                    viewport={{ once: true }}
                                    style={{
                                        position: "absolute",
                                        bottom: -20,
                                        right: 20,
                                        zIndex: 5
                                    }}
                                >
                                    <Paper p="xl" bg="black" c="white" radius={100} w={100} h={100} style={{ display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                                        <Stack gap={0} align="center">
                                            <Text fw={700} fz={20}>+{itemCount}</Text>
                                            <Text fz={8} tt="uppercase">Ürün</Text>
                                        </Stack>
                                    </Paper>
                                </motion.div>
                            )}
                        </Box>
                    </Grid.Col>
                </Grid>
            </Container>
        </Box>
    );
};

export default MyWardrobe;
