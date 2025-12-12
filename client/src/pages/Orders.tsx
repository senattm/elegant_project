import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Text,
  Box,
  Loader,
  Center,
  Stack,
  Title,
  Paper,
  Group,
  Button,
  Image,
  Flex,
} from "@mantine/core";
import { useOrders } from "../store/hooks";
import { useAtom } from "jotai";
import { isAuthenticatedAtom } from "../store/atoms";
import type { Order } from "../types";

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

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === "completed") return "green";
    if (s === "preparing") return "orange";
    if (s === "shipped") return "blue";
    return "gray";
  };

  const getStatusText = (status: string) => {
    const s = status.toLowerCase();
    if (s === "completed") return "Tamamlandı";
    if (s === "preparing") return "Hazırlanıyor";
    if (s === "shipped") return "Kargoda";
    return status;
  };

  const serverUrl =
    import.meta.env.VITE_API_URL?.replace("/api", "") ||
    "http://localhost:5000";

  if (loading) {
    return (
      <Center mih="100vh">
        <Stack align="center" gap="md">
          <Loader color="black" />
          <Text>Siparişler yükleniyor...</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Box mih="100vh" pt={{ base: 250, sm: 180, md: 140 }} pb={80}>
      <Container size="xl">
        <Box mb={60} ta="center">
          <Title order={1} fz={{ base: 32, sm: 40, md: 48 }} mb={12}>
            SİPARİŞLERİM
          </Title>
          <Text
            fz="sm"
            c="dimmed"
            tt="uppercase"
            style={{
              fontWeight: 300,
              letterSpacing: "0.1em",
            }}
            fw={500}
          >
            {orders.length} Sipariş
          </Text>
        </Box>

        {orders.length === 0 ? (
          <Box ta="center" p="100px 20px">
            <Text fz={18} c="gray.7" mb={30}>
              Henüz siparişiniz bulunmuyor
            </Text>
            <Button variant="filled" onClick={() => navigate("/store")}>
              ALIŞVERİŞE BAŞLA
            </Button>
          </Box>
        ) : (
          <Stack gap="lg">
            {orders.map((order) => (
              <Paper
                key={order.orderNumber}
                p="xl"
                withBorder
                style={{ cursor: "pointer", transition: "box-shadow 0.2s" }}
                onClick={() => navigate(`/orders/${order.orderNumber}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 4px 20px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                }}
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
                      c={getStatusColor(order.status)}
                      tt="uppercase"
                      size="sm"
                      style={{
                        fontWeight: 300,
                        letterSpacing: "0.1em",
                      }}
                    >
                      {getStatusText(order.status)}
                    </Text>
                    <Text fw={700} fz="lg" mt={4}>
                      {order.finalAmount.toFixed(2)} TL
                    </Text>
                  </Box>
                </Group>

                <Flex gap="sm" mb="md" wrap="wrap">
                  {order.items.slice(0, 4).map((item, index) => {
                    const imageUrl = item.productImages?.[0]
                      ? item.productImages[0].startsWith("http")
                        ? item.productImages[0]
                        : `${serverUrl}${item.productImages[0]}`
                      : "https://via.placeholder.com/80x80";

                    return (
                      <Box
                        key={item.id || index}
                        style={{
                          position: "relative",
                          borderRadius: "8px",
                          overflow: "hidden",
                        }}
                      >
                        <Image
                          src={imageUrl}
                          alt={item.productName}
                          w={80}
                          h={80}
                          fit="cover"
                          radius="md"
                        />
                        {item.quantity > 1 && (
                          <Box
                            style={{
                              position: "absolute",
                              bottom: 4,
                              right: 4,
                              backgroundColor: "rgba(0,0,0,0.7)",
                              color: "white",
                              borderRadius: "4px",
                              padding: "2px 6px",
                              fontSize: "11px",
                              fontWeight: 600,
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
                      style={{
                        backgroundColor: "#f1f3f4",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
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
      </Container>
    </Box>
  );
};

export default Orders;
