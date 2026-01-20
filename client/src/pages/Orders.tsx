import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Text, Box, Paper, Group, Image, Flex, Stack } from "@mantine/core";
import { useOrders } from "../store/hooks";
import { useAtom } from "jotai";
import { isAuthenticatedAtom } from "../store/atoms";
import type { Order } from "../types";
import PageLayout from "../components/layout/PageLayout";
import PageHeader from "../components/layout/PageHeader";
import LoadingState from "../components/ui/LoadingState";
import EmptyState from "../components/ui/EmptyState";
import { getImageUrl } from "../utils/imageUrl";

const Orders = () => {
  const navigate = useNavigate();
  const [isAuthenticated] = useAtom(isAuthenticatedAtom);
  const { getUserOrders } = useOrders();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }

    const fetchOrders = async () => {
      try {
        const fetchedOrders = await getUserOrders();
        setOrders(fetchedOrders);
      } catch (err) {
        console.error("Siparişler yüklenemedi:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, navigate]);

  if (loading) {
    return <LoadingState message="Siparişler yükleniyor..." />;
  }

  return (
    <PageLayout>
      <PageHeader title="SİPARİŞLERİM" subtitle={`${orders.length} Sipariş`} />

      {orders.length === 0 ? (
        <EmptyState
          message="Henüz siparişiniz bulunmuyor"
          actionLabel="ALIŞVERİŞE BAŞLA"
          onAction={() => navigate("/store")}
        />
      ) : (
        <Stack gap="lg">
          {orders.map((order) => (
            <Paper
              key={order.orderNumber}
              p="xl"
              withBorder
              className="cursor-pointer hover-shadow"
              onClick={() => navigate(`/orders/${order.id}`)}
            >
              <Group justify="space-between" mb="lg">
                <Box>
                  <Text fw={600}>{order.orderNumber}</Text>
                  <Text size="sm" c="dimmed">
                    {new Date(order.createdAt).toLocaleDateString("tr-TR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </Box>
                <Box ta="right">
                  <Text
                    fw={600}
                    c="orange"
                    tt="uppercase"
                    size="sm"
                    style={{
                      fontWeight: 300,
                      letterSpacing: "0.1em",
                    }}
                  >
                    Hazırlanıyor
                  </Text>
                  <Text fw={700} fz="lg" mt={4}>
                    {order.finalAmount.toFixed(2)} TL
                  </Text>
                </Box>
              </Group>

              <Flex gap="sm" mb="md" wrap="wrap">
                {order.items.slice(0, 4).map((item, index) => {
                  const imageUrl = getImageUrl(item.productImages?.[0]);

                  return (
                    <Box
                      key={item.id || index}
                      pos="relative"
                      w={80}
                      h={80}
                      bg="#f5f5f5"
                      className="flex-center overflow-hidden"
                      style={{
                        borderRadius: "8px",
                      }}
                    >
                      <Image
                        src={imageUrl}
                        alt={item.productName}
                        w={80}
                        h={80}
                        fit="contain"
                        radius="md"
                      />
                      {item.quantity > 1 && (
                        <Box
                          pos="absolute"
                          bottom={4}
                          right={4}
                          bg="rgba(0,0,0,0.7)"
                          c="white"
                          fw={600}
                          style={{
                            borderRadius: "4px",
                            padding: "2px 6px",
                            fontSize: "11px",
                          }}
                        >
                          x{item.quantity}
                        </Box>
                      )}
                    </Box>
                  );
                })}
                {order.items.length > 4 && (
                  <Box
                    w={80}
                    h={80}
                    bg="#f1f3f4"
                    className="flex-center"
                    style={{
                      borderRadius: "8px",
                    }}
                  >
                    <Text size="sm" c="dimmed" fw={600}>
                      +{order.items.length - 4}
                    </Text>
                  </Box>
                )}
              </Flex>

              <Text size="sm" c="dimmed">
                {order.items.length} ürün
              </Text>
            </Paper>
          ))}
        </Stack>
      )}
    </PageLayout>
  );
};

export default Orders;
