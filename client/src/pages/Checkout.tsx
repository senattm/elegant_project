import {
  Container,
  Text,
  Box,
  Button,
  Stack,
  TextInput,
  Textarea,
  Paper,
  Group,
  Divider,
  Image,
  Flex,
  Badge,
} from "@mantine/core";
import {
  IconCreditCard,
  IconCalendar,
  IconLock,
  IconUser,
  IconMapPin,
  IconPhone,
  IconHome,
  IconTruck,
  IconDiscount,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useCart, useOrders } from "../store/hooks";
import { useAtom } from "jotai";
import { isAuthenticatedAtom } from "../store/atoms";
import { useEffect, useState } from "react";

interface PaymentData {
  cardNumber: string;
  cardHolderName: string;
  expiryDate: string;
  cvv: string;
}

interface AddressData {
  title: string;
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  district: string;
}

const Checkout = () => {
  const navigate = useNavigate();
  const [isAuthenticated] = useAtom(isAuthenticatedAtom);
  const { cart, getTotalPrice, clearCart, fetchCart } = useCart();
  const { createOrder } = useOrders();
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  const [paymentData, setPaymentData] = useState<PaymentData>({
    cardNumber: "",
    cardHolderName: "",
    expiryDate: "",
    cvv: "",
  });

  const [addressData, setAddressData] = useState<AddressData>({
    title: "",
    fullName: "",
    phone: "",
    addressLine: "",
    city: "",
    district: "",
  });

  const [errors, setErrors] = useState<any>({});
  const [isFirstOrder, setIsFirstOrder] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }

    fetchCart();
  }, [isAuthenticated]);

  useEffect(() => {
    if (cart.length === 0 && isAuthenticated) {
      navigate("/cart");
    }
  }, [cart.length, isAuthenticated, navigate]);

  useEffect(() => {
    const checkDiscount = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:5000/api"
          }/orders/check/first-order`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setIsFirstOrder(data.isFirstOrder);
        }
      } catch (error) {
        console.error("İndirim kontrolü başarısız:", error);
      }
    };

    checkDiscount();
  }, []);

  const total = getTotalPrice();
  const discount = isFirstOrder ? total * 0.1 : 0;
  const shippingCost = total >= 7500 ? 0 : 79;
  const finalTotal = total - discount + shippingCost;

  const getImageUrl = (imageUrl: string) => {
    const serverUrl =
      import.meta.env.VITE_API_URL?.replace("/api", "") ||
      "http://localhost:5000";
    return imageUrl?.startsWith("http") ? imageUrl : `${serverUrl}${imageUrl}`;
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    return cleaned.slice(0, 16);
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const formatCVV = (value: string) => {
    return value.replace(/\D/g, "").slice(0, 4);
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    return cleaned.slice(0, 11);
  };

  const validate = (): boolean => {
    const newErrors: any = {};

    if (!addressData.fullName || addressData.fullName.length < 3) {
      newErrors.fullName = "Ad soyad en az 3 karakter olmalıdır";
    }

    if (!addressData.phone || addressData.phone.length < 10) {
      newErrors.phone = "Telefon numarası en az 10 haneli olmalıdır";
    }

    if (!addressData.addressLine || addressData.addressLine.length < 10) {
      newErrors.addressLine = "Adres en az 10 karakter olmalıdır";
    }

    if (!addressData.city || addressData.city.length < 2) {
      newErrors.city = "Şehir gerekli";
    }

    if (!addressData.district || addressData.district.length < 2) {
      newErrors.district = "İlçe gerekli";
    }

    if (paymentData.cardNumber.length !== 16) {
      newErrors.cardNumber = "Kart numarası 16 haneli olmalıdır";
    }

    if (!paymentData.cardHolderName || paymentData.cardHolderName.length < 3) {
      newErrors.cardHolderName = "Kart sahibi adı en az 3 karakter olmalıdır";
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(paymentData.expiryDate)) {
      newErrors.expiryDate = "Geçerli bir tarih girin (AA/YY)";
    }

    if (paymentData.cvv.length < 3 || paymentData.cvv.length > 4) {
      newErrors.cvv = "CVV 3-4 haneli olmalıdır";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsCreatingOrder(true);
    try {
      await createOrder(cart, paymentData);
      await clearCart();
      navigate("/orders");
    } catch (error) {
      console.error("Sipariş oluşturulamadı:", error);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const titleStyle = {
    fontWeight: 300,
    letterSpacing: "0.1em",
    fontFamily: "Playfair Display, serif",
  };

  return (
    <Box mih="100vh" pt={{ base: 230, sm: 180, md: 140 }} pb={60}>
      <Container size="lg">
        <Box mb={50} ta="center">
          <Text fz={{ base: 28, sm: 36, md: 42 }} mb={12} style={titleStyle}>
            ÖDEME
          </Text>
          <Text size="sm" c="dimmed" tt="uppercase">
            Sipariş Toplam: {finalTotal.toFixed(2)} TL
          </Text>
        </Box>

        <Flex
          direction={{ base: "column", md: "row" }}
          gap="xl"
          align="flex-start"
        >
          <Box style={{ flex: 1 }}>
            <Stack gap="xl">
              <Paper shadow="none" p="xl" radius={0} withBorder>
                <Text fz={20} fw={500} mb="md">
                  Teslimat Adresi
                </Text>
                <Stack gap="md">
                  <TextInput
                    label="Adres Başlığı"
                    placeholder="Ev, İş, vb."
                    leftSection={<IconHome size={18} />}
                    value={addressData.title}
                    onChange={(e) =>
                      setAddressData({ ...addressData, title: e.target.value })
                    }
                    radius={0}
                  />

                  <TextInput
                    label="Ad Soyad"
                    placeholder="Ahmet Yılmaz"
                    leftSection={<IconUser size={18} />}
                    value={addressData.fullName}
                    onChange={(e) =>
                      setAddressData({
                        ...addressData,
                        fullName: e.target.value,
                      })
                    }
                    error={errors.fullName}
                    required
                    radius={0}
                  />

                  <TextInput
                    label="Telefon"
                    placeholder="05XX XXX XX XX"
                    leftSection={<IconPhone size={18} />}
                    value={addressData.phone}
                    onChange={(e) =>
                      setAddressData({
                        ...addressData,
                        phone: formatPhone(e.target.value),
                      })
                    }
                    error={errors.phone}
                    required
                    radius={0}
                  />

                  <Textarea
                    label="Adres"
                    placeholder="Mahalle, Sokak, No, vb."
                    leftSection={<IconMapPin size={18} />}
                    value={addressData.addressLine}
                    onChange={(e) =>
                      setAddressData({
                        ...addressData,
                        addressLine: e.target.value,
                      })
                    }
                    error={errors.addressLine}
                    minRows={3}
                    required
                    radius={0}
                  />

                  <Group grow>
                    <TextInput
                      label="Şehir"
                      placeholder="İstanbul"
                      value={addressData.city}
                      onChange={(e) =>
                        setAddressData({ ...addressData, city: e.target.value })
                      }
                      error={errors.city}
                      required
                      radius={0}
                    />

                    <TextInput
                      label="İlçe"
                      placeholder="Kadıköy"
                      value={addressData.district}
                      onChange={(e) =>
                        setAddressData({
                          ...addressData,
                          district: e.target.value,
                        })
                      }
                      error={errors.district}
                      required
                      radius={0}
                    />
                  </Group>
                </Stack>
              </Paper>

              <Divider />

              <Paper shadow="none" p="xl" radius={0} withBorder>
                <Text fz={20} fw={500} mb="md">
                  Kart Bilgileri
                </Text>
                <Stack gap="md">
                  <TextInput
                    label="Kart Numarası"
                    placeholder="1234 5678 9012 3456"
                    leftSection={<IconCreditCard size={18} />}
                    value={paymentData.cardNumber}
                    onChange={(e) =>
                      setPaymentData({
                        ...paymentData,
                        cardNumber: formatCardNumber(e.target.value),
                      })
                    }
                    error={errors.cardNumber}
                    required
                    radius={0}
                  />

                  <TextInput
                    label="Kart Sahibi"
                    placeholder="AHMET YILMAZ"
                    leftSection={<IconUser size={18} />}
                    value={paymentData.cardHolderName}
                    onChange={(e) =>
                      setPaymentData({
                        ...paymentData,
                        cardHolderName: e.target.value.toUpperCase(),
                      })
                    }
                    error={errors.cardHolderName}
                    required
                    radius={0}
                  />

                  <Group grow>
                    <TextInput
                      label="Son Kullanma Tarihi"
                      placeholder="MM/YY"
                      leftSection={<IconCalendar size={18} />}
                      value={paymentData.expiryDate}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          expiryDate: formatExpiryDate(e.target.value),
                        })
                      }
                      error={errors.expiryDate}
                      required
                      radius={0}
                    />

                    <TextInput
                      label="CVV"
                      placeholder="123"
                      type="password"
                      leftSection={<IconLock size={18} />}
                      value={paymentData.cvv}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          cvv: formatCVV(e.target.value),
                        })
                      }
                      error={errors.cvv}
                      required
                      radius={0}
                    />
                  </Group>
                </Stack>
              </Paper>

              <Group justify="space-between" mt="xl">
                <Button
                  variant="outline"
                  color="dark"
                  size="lg"
                  onClick={() => navigate("/cart")}
                  radius={0}
                >
                  Sepete Dön
                </Button>
                <Button
                  variant="filled"
                  color="dark"
                  size="lg"
                  onClick={handleSubmit}
                  loading={isCreatingOrder}
                  radius={0}
                >
                  Siparişi Tamamla
                </Button>
              </Group>
            </Stack>
          </Box>

          <Box
            w={{ base: "100%", md: 400 }}
            style={{
              position: "sticky",
              top: 140,
            }}
          >
            <Paper shadow="none" p="xl" radius={0} withBorder>
              <Text fz={20} fw={500} mb="md">
                Sipariş Özeti
              </Text>

              <Stack gap="md" mb="md">
                {cart.map((item) => {
                  const price =
                    typeof item.product.price === "string"
                      ? parseFloat(item.product.price)
                      : item.product.price;
                  const imageUrl = item.product.images?.[0]
                    ? getImageUrl(item.product.images[0])
                    : "https://via.placeholder.com/80";

                  return (
                    <Flex
                      key={`${item.product.id}-${item.selectedSize}`}
                      gap="md"
                      align="center"
                    >
                      <Image
                        src={imageUrl}
                        alt={item.product.name}
                        w={60}
                        h={80}
                        fit="cover"
                        radius={0}
                      />
                      <Box style={{ flex: 1 }}>
                        <Text fz={14} fw={500} lineClamp={1}>
                          {item.product.name}
                        </Text>
                        <Text fz={12} c="dimmed">
                          Beden: {item.selectedSize} × {item.quantity}
                        </Text>
                        <Text fz={14} fw={600}>
                          {(price * item.quantity).toFixed(2)} TL
                        </Text>
                      </Box>
                    </Flex>
                  );
                })}
              </Stack>

              <Divider mb="md" />

              <Stack gap="md" mb="md">
                <Group justify="space-between">
                  <Text fz={14}>Ara Toplam</Text>
                  <Text fz={14} fw={500}>
                    {total.toFixed(2)} TL
                  </Text>
                </Group>

                <Group justify="space-between">
                  <Group gap="xs">
                    <IconTruck size={16} />
                    <Text fz={14} c={shippingCost === 0 ? "green" : "dark"}>
                      Kargo
                    </Text>
                  </Group>
                  <Text fz={14} fw={500} c={shippingCost === 0 ? "green" : "dark"}>
                    {shippingCost === 0 ? "ÜCRETSİZ" : `${shippingCost.toFixed(2)} TL`}
                  </Text>
                </Group>

                {isFirstOrder && (
                  <Group justify="space-between">
                    <Group gap="xs">
                      <IconDiscount size={16} />
                      <Text fz={14} c="blue">
                        İlk Sipariş İndirimi (%10)
                      </Text>
                    </Group>
                    <Text fz={14} fw={500} c="blue">
                      -{discount.toFixed(2)} TL
                    </Text>
                  </Group>
                )}
              </Stack>

              <Divider mb="md" />

              <Group justify="space-between" mb="md">
                <Text fz={18} fw={700}>
                  Toplam
                </Text>
                <Text fz={24} fw={700}>
                  {finalTotal.toFixed(2)} TL
                </Text>
              </Group>

              <Stack gap="xs">
                {shippingCost === 0 ? (
                  <Badge
                    color="green"
                    variant="light"
                    size="lg"
                    leftSection={<IconTruck size={16} />}
                    fullWidth
                    radius={0}
                  >
                    Ücretsiz Kargo
                  </Badge>
                ) : (
                  <Badge
                    color="orange"
                    variant="light"
                    size="lg"
                    leftSection={<IconTruck size={16} />}
                    fullWidth
                    radius={0}
                  >
                    7500 TL üzeri alışverişlerde ücretsiz kargo
                  </Badge>
                )}
                {isFirstOrder && (
                  <Badge
                    color="blue"
                    variant="light"
                    size="lg"
                    leftSection={<IconDiscount size={16} />}
                    fullWidth
                    radius={0}
                  >
                    İlk Siparişinize Özel %10 İndirim Uygulandı
                  </Badge>
                )}
              </Stack>
            </Paper>
          </Box>
        </Flex>
      </Container>
    </Box>
  );
};

export default Checkout;
