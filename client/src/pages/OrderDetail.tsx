import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Image,
  Flex,
} from "@mantine/core";
import { useOrders } from "../store/hooks";
import type { Order } from "../types";

const OrderDetail = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { getOrderById } = useOrders();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError("Sipariş ID bulunamadı.");
        setLoading(false);
        return;
      }
      try {
        const fetchedOrder = await getOrderById(Number(orderId));
        setOrder(fetchedOrder);
      } catch (err: any) {
        setError(err.message || "Sipariş detayları yüklenemedi.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, getOrderById]);

  const titleStyle = {
    fontWeight: 300,
    letterSpacing: "0.1em",
    fontFamily: "Playfair Display, serif",
  };

  const uppercaseStyle = { letterSpacing: "0.05em" };

  if (loading) {
    return (
      <Center mih="100vh">
        <Stack align="center" gap="md">
          <Loader color="black" size="lg" />
          <Text>Sipariş yükleniyor...</Text>
        </Stack>
      </Center>
    );
  }

  if (error) {
    return (
      <Center mih="100vh">
        <Text c="red" size="lg">
          Hata: {error}
        </Text>
      </Center>
    );
  }

  if (!order) {
    return (
      <Center mih="100vh">
        <Text c="dimmed" size="lg">
          Sipariş bulunamadı.
        </Text>
      </Center>
    );
  }

  const serverUrl =
    import.meta.env.VITE_API_URL?.replace("/api", "") ||
    "http://localhost:5000";

  return (
    <Box mih="100vh" pt={{ base: 250, sm: 180, md: 140 }} pb={80}>
      <Container size="xl">
        <Box mb={60} ta="center">
          <Title
            order={1}
            fz={{ base: 32, sm: 40, md: 48 }}
            style={titleStyle}
            mb={12}
          >
            SİPARİŞ DETAYI
          </Title>
          <Text
            fz="sm"
            c="dimmed"
            tt="uppercase"
            style={uppercaseStyle}
            fw={500}
          >
            {order.orderNumber}
          </Text>
        </Box>

        <Paper p="xl" mb="xl" withBorder>
          <Stack gap="lg">
            <Group justify="space-between">
              <Text fw={600} size="sm" tt="uppercase" style={uppercaseStyle}>
                Sipariş Numarası
              </Text>
              <Text fw={600}>{order.orderNumber}</Text>
            </Group>

            <Group justify="space-between">
              <Text fw={600} size="sm" tt="uppercase" style={uppercaseStyle}>
                Durum
              </Text>
              <Text
                fw={600}
                c={
                  order.status === "COMPLETED" || order.status === "completed"
                    ? "green"
                    : order.status === "PREPARING" ||
                      order.status === "preparing"
                    ? "orange"
                    : order.status === "SHIPPED" || order.status === "shipped"
                    ? "blue"
                    : "gray"
                }
              >
                {order.status === "COMPLETED" || order.status === "completed"
                  ? "Tamamlandı"
                  : order.status === "PREPARING" || order.status === "preparing"
                  ? "Hazırlanıyor"
                  : order.status === "SHIPPED" || order.status === "shipped"
                  ? "Kargoda"
                  : order.status}
              </Text>
            </Group>

            <Group justify="space-between">
              <Text fw={600} size="sm" tt="uppercase" style={uppercaseStyle}>
                Tarih
              </Text>
              <Text>
                {new Date(order.createdAt).toLocaleDateString("tr-TR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </Group>

            {order.discountAmount > 0 && (
              <>
                <Group justify="space-between">
                  <Text
                    fw={600}
                    size="sm"
                    tt="uppercase"
                    style={uppercaseStyle}
                  >
                    Ara Toplam
                  </Text>
                  <Text>{order.totalAmount.toFixed(2)} TL</Text>
                </Group>
                <Group justify="space-between">
                  <Text
                    fw={600}
                    size="sm"
                    tt="uppercase"
                    style={uppercaseStyle}
                  >
                    İndirim
                  </Text>
                  <Text c="green">-{order.discountAmount.toFixed(2)} TL</Text>
                </Group>
              </>
            )}

            <Group justify="space-between">
              <Text fw={600} size="sm" tt="uppercase" style={uppercaseStyle}>
                Toplam Tutar
              </Text>
              <Text fz="lg" fw={700}>
                {order.finalAmount.toFixed(2)} TL
              </Text>
            </Group>
          </Stack>
        </Paper>

        <Title order={2} fz="xl" mb="lg" style={titleStyle}>
          Sipariş Edilen Ürünler
        </Title>
        <Stack gap="md">
          {order.items.map((item) => (
            <Paper key={item.id} p="md" withBorder>
              <Flex align="center" gap="md">
                <Image
                  src={
                    item.productImages?.[0]
                      ? item.productImages[0].startsWith("http")
                        ? item.productImages[0]
                        : `${serverUrl}${item.productImages[0]}`
                      : "https://via.placeholder.com/100x100"
                  }
                  alt={item.productName}
                  w={80}
                  h={80}
                  fit="cover"
                />
                <Box style={{ flex: 1 }}>
                  <Text fw={600}>{item.productName}</Text>
                  <Text size="sm" c="dimmed">
                    Beden: {item.selectedSize || "N/A"}
                  </Text>
                  <Text size="sm" c="dimmed">
                    Adet: {item.quantity}
                  </Text>
                </Box>
                <Text fw={600}>
                  {(item.price * item.quantity).toFixed(2)} TL
                </Text>
              </Flex>
            </Paper>
          ))}
        </Stack>
      </Container>
    </Box>
  );
};

export default OrderDetail;
