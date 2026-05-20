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
        { id: 1, image: getImageUrl("101-0.jpg"), name: "Siyah Saten Elbise" },
        { id: 2, image: getImageUrl("104-0.jpg"), name: "Oversize Blazer" },
        { id: 3, image: getImageUrl("110-0.jpg"), name: "Deri Topuklu Ayakkabı" },
    ]);
    const [itemCount, setItemCount] = useState(0);
    const [showBadge, setShowBadge] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

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
        <Box py={120} bg="#fafafa" style={{ borderTop: "1px solid #f1f1f1", overflow: "hidden" }}>
            <Container size="xl">
                <Grid gutter={80} align="center">
                    <Grid.Col span={{ base: 12, md: 5 }} pl={{ base: 0, md: 80, lg: 140 }}>
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                        >
                            <Title order={2} fz={{ base: 40, md: 56 }} mb="lg" fw={400} style={{ fontFamily: 'Playfair Display, serif', lineHeight: 1 }}>
                                Dolabınız
                            </Title>

                            <Text size="lg" c="gray.7" mb={40} lh={1.8} fw={400}>
                                Satın aldığınız her parça otomatik olarak koleksiyonunuza eklenir. Akıllı algoritmamız, parçalarınızı analiz ederek her gün için yepyeni ve kusursuz kombinler yaratır.
                            </Text>

                            <Group gap="md">
                                <Button
                                    variant="filled"
                                    color="black"
                                    size="xl"
                                    radius={0}
                                    onClick={() => navigate("/wardrobe")}
                                    rightSection={<IconArrowRight size={18} />}
                                    style={{ paddingLeft: 40, paddingRight: 40, letterSpacing: "1px", fontWeight: 600, fontSize: "13px" }}
                                >
                                    DOLABIMI KEŞFET
                                </Button>
                            </Group>
                        </motion.div>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, md: 7 }}>
                        <Box 
                            pos="relative" 
                            h={{ base: 400, sm: 500 }} 
                            w="100%" 
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                        >
                            {displayItems.map((item, index) => {
                                const isTop = index === 0;
                                
                                // Default positions (Stacked)
                                const defaultRotate = index === 0 ? 0 : index === 1 ? -12 : 12;
                                const defaultScale = index === 0 ? 1 : index === 1 ? 0.9 : 0.9;
                                const defaultYOffset = index === 0 ? 0 : index === 1 ? -20 : 20;
                                const defaultXOffset = index === 0 ? 0 : index === 1 ? -80 : 80;
                                
                                // Hovered positions (Spread)
                                const hoverRotate = index === 0 ? 0 : index === 1 ? -20 : 20;
                                const hoverScale = index === 0 ? 1.05 : 0.95;
                                const hoverYOffset = index === 0 ? -15 : index === 1 ? -10 : 30;
                                const hoverXOffset = index === 0 ? 0 : index === 1 ? -200 : 200;
                                
                                const zIndex = 10 - index;
                                
                                return (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 100 }}
                                        whileInView={{ opacity: 1 }}
                                        animate={{ 
                                            y: isHovered ? hoverYOffset : defaultYOffset, 
                                            x: isHovered ? hoverXOffset : defaultXOffset, 
                                            rotate: isHovered ? hoverRotate : defaultRotate, 
                                            scale: isHovered ? hoverScale : defaultScale 
                                        }}
                                        transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 20 }}
                                        viewport={{ once: true }}
                                        style={{
                                            position: 'absolute',
                                            width: '52%',
                                            maxWidth: '300px',
                                            aspectRatio: '3/4',
                                            zIndex: zIndex,
                                        }}
                                    >
                                        <Paper 
                                            radius="lg" 
                                            p={0} 
                                            bg="white" 
                                            shadow={isTop ? "xl" : "sm"} 
                                            style={{ 
                                                overflow: 'hidden', 
                                                height: '100%',
                                                width: '100%',
                                                border: '8px solid white',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => navigate("/wardrobe")}
                                        >
                                            <Image src={item.image} fit="cover" h="100%" w="100%" />
                                            {isTop && (
                                                <Box 
                                                    pos="absolute" 
                                                    bottom={15} 
                                                    left={15} 
                                                    right={15}
                                                    bg="rgba(255, 255, 255, 0.9)" 
                                                    style={{ 
                                                        backdropFilter: "blur(8px)", 
                                                        borderRadius: "12px",
                                                    }} 
                                                    px={16} 
                                                    py={10}
                                                >
                                                    <Text size="sm" fw={600} c="black" truncate="end" ta="center">{item.name}</Text>
                                                </Box>
                                            )}
                                        </Paper>
                                    </motion.div>
                                );
                            })}


                        </Box>
                    </Grid.Col>
                </Grid>
            </Container>
        </Box>
    );
};

export default MyWardrobe;
