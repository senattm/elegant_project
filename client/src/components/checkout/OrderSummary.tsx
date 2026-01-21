import { Paper, Text, Stack, Divider, Group, Image, Box } from "@mantine/core";
import { IconTruck, IconDiscount } from "@tabler/icons-react";
import type { CartItem } from "../../types";

interface OrderSummaryProps {
    cart: Array<CartItem>;
    total: number;
    discount: number;
    shippingCost: number;
    finalTotal: number;
    isFirstOrder: boolean;
    getImageUrl: (url: string) => string;
}

const OrderSummary = ({
    cart,
    total,
    discount,
    shippingCost,
    finalTotal,
    isFirstOrder,
    getImageUrl,
}: OrderSummaryProps) => {
    return (
        <Box w={{ base: "100%", md: 400 }}>
            <Paper shadow="none" p="xl" withBorder pos="sticky" top={140}>
                <Text fz={20} fw={500} mb="lg">
                    Sipariş Özeti
                </Text>

                <Stack gap="md" mb="lg">
                    {cart.map((item) => {
                        const price =
                            typeof item.product.price === "string"
                                ? parseFloat(item.product.price)
                                : item.product.price;
                        const imageUrl = getImageUrl(item.product.images?.[0] || "");

                        return (
                            <Group key={`${item.product.id}-${item.selectedSize || 'no-size'}`} gap="md">
                                <Image
                                    src={imageUrl}
                                    alt={item.product.name}
                                    w={60}
                                    h={80}
                                    fit="cover"
                                />
                                <Box flex={1}>
                                    <Text fz="sm" fw={500} lineClamp={2}>
                                        {item.product.name}
                                    </Text>
                                    <Text fz="xs" c="dimmed">
                                        {item.selectedSize && `Beden: ${item.selectedSize} | `}Adet: {item.quantity}
                                    </Text>
                                    <Text fz="sm" fw={600}>
                                        {(price * item.quantity).toFixed(2)} TL
                                    </Text>
                                </Box>
                            </Group>
                        );
                    })}
                </Stack>

                <Divider mb="md" />

                <Stack gap="xs">
                    <Group justify="space-between">
                        <Text c="dimmed">Ara Toplam</Text>
                        <Text fw={500}>{total.toFixed(2)} TL</Text>
                    </Group>

                    {isFirstOrder && discount > 0 && (
                        <Group justify="space-between">
                            <Group gap={4}>
                                <IconDiscount size={16} />
                                <Text c="green">İlk Sipariş İndirimi (%10)</Text>
                            </Group>
                            <Text c="green" fw={500}>
                                -{discount.toFixed(2)} TL
                            </Text>
                        </Group>
                    )}

                    <Group justify="space-between">
                        <Group gap={4}>
                            <IconTruck size={16} />
                            <Text c="dimmed">Kargo</Text>
                        </Group>
                        <Text fw={500}>
                            {shippingCost === 0 ? "ÜCRETSİZ" : `${shippingCost.toFixed(2)} TL`}
                        </Text>
                    </Group>


                    {total >= 7500 ? (
                        <Text size="xs" c="green" ta="center" fw={500}>
                            7500 TL ve üzeri alışverişlerde kargo ücretsiz!
                        </Text>
                    ) : (
                        <Text size="xs" c="dimmed" ta="center">
                            {(7500 - total).toFixed(2)} TL daha alışveriş yapın, kargo ücretsiz olsun!
                        </Text>
                    )}
                </Stack>

                <Divider my="md" />

                <Group justify="space-between">
                    <Text fz="lg" fw={600}>
                        Toplam
                    </Text>
                    <Text fz="xl" fw={700}>
                        {finalTotal.toFixed(2)} TL
                    </Text>
                </Group>
            </Paper>
        </Box>
    );
};

export default OrderSummary;
