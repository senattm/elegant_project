import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Text,
  Box,
  Stack,
  Paper,
  Group,
  Image,
  Flex,
  Title,
} from "@mantine/core";
import { useOrders } from "../store/hooks";
import type { Order } from "../types";
import PageLayout from "../components/layout/PageLayout";
import PageHeader from "../components/layout/PageHeader";
import BackButton from "../components/ui/BackButton";
import LoadingState from "../components/ui/LoadingState";
import EmptyState from "../components/ui/EmptyState";
import { getImageUrl } from "../utils/imageUrl";

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

  if (loading) {
    return <LoadingState message="Sipariş yükleniyor..." />;
  }

  if (error) {
    return (
      <PageLayout>
        <EmptyState message={`Hata: ${error}`} />
      </PageLayout>
    );
  }

  if (!order) {
    return (
      <PageLayout>
        <EmptyState message="Sipariş bulunamadı." />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <BackButton onClick={() => navigate("/orders")} />
      <PageHeader
        title="SİPARİŞ DETAYI"
        subtitle={`Sipariş #${order.orderNumber}`}
        mb={60}
      />

      <Paper p="xl" mb="xl" withBorder>
          <Stack gap="lg">
            <Group justify="space-between">
              <Text
                fw={600}
                size="sm"
                tt="uppercase"
                style={{
                  fontWeight: 300,
                  letterSpacing: "0.1em",
                }}
              >
                Sipariş Numarası
              </Text>
              <Text fw={600}>{order.orderNumber}</Text>
            </Group>

            <Group justify="space-between">
              <Text
                fw={600}
                size="sm"
                tt="uppercase"
                style={{
                  fontWeight: 300,
                  letterSpacing: "0.1em",
                }}
              >
                Durum
              </Text>
              <Text fw={600} c="orange">
                Hazırlanıyor
              </Text>
            </Group>

            <Group justify="space-between">
              <Text
                fw={600}
                size="sm"
                tt="uppercase"
                style={{
                  fontWeight: 300,
                  letterSpacing: "0.1em",
                }}
              >
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
                    style={{
                      fontWeight: 300,
                      letterSpacing: "0.1em",
                    }}
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
                    style={{
                      fontWeight: 300,
                      letterSpacing: "0.1em",
                    }}
                  >
                    İndirim
                  </Text>
                  <Text c="green">-{order.discountAmount.toFixed(2)} TL</Text>
                </Group>
              </>
            )}

            <Group justify="space-between">
              <Text
                fw={600}
                size="sm"
                tt="uppercase"
                style={{
                  fontWeight: 300,
                  letterSpacing: "0.1em",
                }}
              >
                Toplam Tutar
              </Text>
              <Text fz="lg" fw={700}>
                {order.finalAmount.toFixed(2)} TL
              </Text>
            </Group>
          </Stack>
        </Paper>

        <Title order={2} fz="xl" mb="lg">
          Sipariş Edilen Ürünler
        </Title>
        <Stack gap="md">
          {order.items.map((item) => (
            <Paper
              key={item.id}
              p="md"
              withBorder
              style={{
                cursor: "pointer",
                transition: "box-shadow 0.2s",
              }}
              onClick={() => navigate(`/product/${item.productId}`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 4px 20px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <Flex align="center" gap="md">
                <Box
                  style={{
                    width: "80px",
                    height: "80px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#f5f5f5",
                    borderRadius: "8px",
                    overflow: "hidden",
                  }}
                >
                  <Image
                    src={getImageUrl(item.productImages?.[0])}
                    alt={item.productName}
                    w={80}
                    h={80}
                    fit="contain"
                  />
                </Box>
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
    </PageLayout>
  );
};

export default OrderDetail;
