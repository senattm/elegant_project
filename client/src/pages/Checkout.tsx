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
  Select,
  Title,
  Checkbox,
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
import { isAuthenticatedAtom, tokenAtom } from "../store/atoms";
import { useEffect, useState } from "react";
import { addressesApi, paymentMethodsApi } from "../api/client";
import type { Address } from "../types";

interface PaymentData {
  cardNumber: string;
  cardHolderName: string;
  expiryDate: string;
  cvv: string;
}

interface PaymentMethod {
  id: number;
  card_holder: string;
  card_last4: string;
  provider: string;
  created_at: string;
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
  const [token] = useAtom(tokenAtom);
  const { cart, getTotalPrice, clearCart, fetchCart } = useCart();
  const { createOrder } = useOrders();
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  const [paymentData, setPaymentData] = useState<PaymentData>({
    cardNumber: "",
    cardHolderName: "",
    expiryDate: "",
    cvv: "",
  });

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null
  );
  const [useNewAddress, setUseNewAddress] = useState(false);

  const [savedPaymentMethods, setSavedPaymentMethods] = useState<
    PaymentMethod[]
  >([]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<
    string | null
  >(null);
  const [useNewPaymentMethod, setUseNewPaymentMethod] = useState(false);
  const [savePaymentMethod, setSavePaymentMethod] = useState(false);

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

    setPaymentData({
      cardNumber: "",
      cardHolderName: "",
      expiryDate: "",
      cvv: "",
    });
    setSavePaymentMethod(false);

    fetchCart();
    loadSavedAddresses();
    loadSavedPaymentMethods();
  }, [isAuthenticated]);

  const loadSavedAddresses = async () => {
    if (!token) return;
    try {
      const response = await addressesApi.getAll(token);
      setSavedAddresses(response.data);
      if (response.data.length > 0 && !selectedAddressId) {
        setSelectedAddressId(response.data[0].id.toString());
      }
    } catch (error) {
      console.error("Adresler yüklenemedi:", error);
    }
  };

  const loadSavedPaymentMethods = async () => {
    if (!token) return;
    try {
      const response = await paymentMethodsApi.getAll(token);
      setSavedPaymentMethods(response.data);
      if (
        response.data.length > 0 &&
        !selectedPaymentMethodId &&
        !useNewPaymentMethod
      ) {
        setSelectedPaymentMethodId(response.data[0].id.toString());
        const selectedMethod = response.data[0];
        setPaymentData((prev) => ({
          ...prev,
          cardNumber: `000000000000${selectedMethod.card_last4}`,
          cardHolderName: selectedMethod.card_holder,
          expiryDate: "12/25",
          cvv: "",
        }));
        setSavePaymentMethod(false);
      }
    } catch (error) {
      console.error("Kartlar yüklenemedi:", error);
    }
  };

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

    if (isAuthenticated) {
      checkDiscount();
    }
  }, [isAuthenticated]);

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

    if (useNewAddress || !selectedAddressId) {
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
    }

    if (useNewPaymentMethod || !selectedPaymentMethodId) {
      if (paymentData.cardNumber.length !== 16) {
        newErrors.cardNumber = "Kart numarası 16 haneli olmalıdır";
      }

      if (
        !paymentData.cardHolderName ||
        paymentData.cardHolderName.length < 3
      ) {
        newErrors.cardHolderName = "Kart sahibi adı en az 3 karakter olmalıdır";
      }

      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(paymentData.expiryDate)) {
        newErrors.expiryDate = "Geçerli bir tarih girin (AA/YY)";
      }
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
      let addressId: number | undefined;

      if (useNewAddress || !selectedAddressId) {
        if (!token) {
          console.error("Token bulunamadı");
          return;
        }
        const newAddress = await addressesApi.create(addressData, token);
        addressId = newAddress.data.id;
      } else {
        addressId = parseInt(selectedAddressId);
      }

      let finalPaymentData = paymentData;

      if (useNewPaymentMethod || !selectedPaymentMethodId) {
        if (savePaymentMethod) {
          if (!token) {
            console.error("Token bulunamadı");
            return;
          }
          await paymentMethodsApi.create(
            {
              cardNumber: paymentData.cardNumber,
              cardHolderName: paymentData.cardHolderName,
              expiryDate: paymentData.expiryDate,
            },
            token
          );
        }
      } else {
        const selectedMethod = savedPaymentMethods.find(
          (m) => m.id.toString() === selectedPaymentMethodId
        );
        if (selectedMethod) {
          finalPaymentData = {
            cardNumber: `000000000000${selectedMethod.card_last4}`,
            cardHolderName: selectedMethod.card_holder,
            expiryDate: paymentData.expiryDate,
            cvv: paymentData.cvv,
          };
        }
      }

      await createOrder(cart, finalPaymentData, addressId);
      await clearCart();
      navigate("/orders");
    } catch (error) {
      console.error("Sipariş oluşturulamadı:", error);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  return (
    <Box mih="100vh" pt={{ base: 230, sm: 180, md: 140 }} pb={60}>
      <Container>
        <Box mb={50} ta="center">
          <Title
            order={2}
            fz={{ base: 28, sm: 36, md: 42 }}
            mb={12}
            tt="uppercase"
          >
            Ödeme
          </Title>
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
              <Paper shadow="none" p="xl" withBorder>
                <Text fz={20} fw={500} mb="md">
                  Teslimat Adresi
                </Text>
                <Stack gap="md">
                  {savedAddresses.length > 0 && !useNewAddress ? (
                    <>
                      <Select
                        label="Kayıtlı Adreslerim"
                        placeholder="Adres seçin"
                        data={savedAddresses.map((addr) => ({
                          value: addr.id.toString(),
                          label: `${addr.title || "Adres"} - ${
                            addr.full_name
                          } - ${addr.city}/${addr.district}`,
                        }))}
                        value={selectedAddressId}
                        onChange={(value) => setSelectedAddressId(value)}
                      />
                      <Button
                        variant="subtle"
                        size="sm"
                        onClick={() => setUseNewAddress(true)}
                      >
                        Yeni Adres Kullan
                      </Button>
                    </>
                  ) : (
                    <>
                      {savedAddresses.length > 0 && (
                        <Button
                          variant="subtle"
                          size="sm"
                          onClick={() => setUseNewAddress(false)}
                          mb="md"
                        >
                          Kayıtlı Adreslerime Dön
                        </Button>
                      )}
                      <TextInput
                        label="Adres Başlığı"
                        placeholder="Ev, İş, vb."
                        leftSection={<IconHome size={18} />}
                        value={addressData.title}
                        onChange={(e) =>
                          setAddressData({
                            ...addressData,
                            title: e.target.value,
                          })
                        }
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
                      />

                      <Group grow>
                        <TextInput
                          label="Şehir"
                          placeholder="İstanbul"
                          value={addressData.city}
                          onChange={(e) =>
                            setAddressData({
                              ...addressData,
                              city: e.target.value,
                            })
                          }
                          error={errors.city}
                          required
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
                        />
                      </Group>
                    </>
                  )}
                </Stack>
              </Paper>

              <Divider />

              <Paper shadow="none" p="xl" withBorder>
                <Text fz={20} fw={500} mb="md">
                  Kart Bilgileri
                </Text>
                <Stack gap="md">
                  {savedPaymentMethods.length > 0 && !useNewPaymentMethod ? (
                    <>
                      <Select
                        label="Kayıtlı Kartlarım"
                        placeholder="Kart seçin"
                        data={savedPaymentMethods.map((method) => ({
                          value: method.id.toString(),
                          label: `**** **** **** ${method.card_last4} - ${method.card_holder}`,
                        }))}
                        value={selectedPaymentMethodId}
                        onChange={(value) => {
                          setSelectedPaymentMethodId(value);
                          if (value) {
                            const selectedMethod = savedPaymentMethods.find(
                              (m) => m.id.toString() === value
                            );
                            if (selectedMethod) {
                              setPaymentData({
                                cardNumber: `000000000000${selectedMethod.card_last4}`,
                                cardHolderName: selectedMethod.card_holder,
                                expiryDate: "12/25",
                                cvv: "",
                              });
                            }
                          }
                        }}
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
                      />
                      <Button
                        variant="subtle"
                        size="sm"
                        onClick={() => {
                          setUseNewPaymentMethod(true);
                          setPaymentData({
                            cardNumber: "",
                            cardHolderName: "",
                            expiryDate: "",
                            cvv: "",
                          });
                          setSavePaymentMethod(false);
                        }}
                      >
                        Yeni Kart Ekle
                      </Button>
                    </>
                  ) : (
                    <>
                      {savedPaymentMethods.length > 0 && (
                        <Button
                          variant="subtle"
                          size="sm"
                          onClick={() => setUseNewPaymentMethod(false)}
                          mb="md"
                        >
                          Kayıtlı Kartlarıma Dön
                        </Button>
                      )}
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
                        />
                      </Group>

                      <Checkbox
                        label="Bu kartı kaydet"
                        checked={savePaymentMethod}
                        onChange={(e) =>
                          setSavePaymentMethod(e.currentTarget.checked)
                        }
                        mt="sm"
                      />
                    </>
                  )}
                </Stack>
              </Paper>

              <Group justify="space-between" mt="xl">
                <Button variant="outline" onClick={() => navigate("/cart")}>
                  Sepete Dön
                </Button>
                <Button
                  variant="filled"
                  onClick={handleSubmit}
                  loading={isCreatingOrder}
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
            <Paper shadow="none" p="xl" withBorder>
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

                {isFirstOrder && (
                  <Group justify="space-between">
                    <Group gap="xs">
                      <IconDiscount size={16} color="#16a34a" />
                      <Text fz={14} c="#16a34a" fw={500}>
                        İlk Sipariş İndirimi
                      </Text>
                    </Group>
                    <Text fz={14} fw={600} c="#16a34a">
                      -{discount.toFixed(2)} TL
                    </Text>
                  </Group>
                )}

                <Group justify="space-between">
                  <Group gap="xs">
                    <IconTruck
                      size={16}
                      color={shippingCost === 0 ? "#16a34a" : undefined}
                    />
                    <Text fz={14} c={shippingCost === 0 ? "#16a34a" : "dark"}>
                      Kargo
                    </Text>
                  </Group>
                  <Text
                    fz={14}
                    fw={500}
                    c={shippingCost === 0 ? "#16a34a" : "dark"}
                  >
                    {shippingCost === 0
                      ? "ÜCRETSİZ"
                      : `${shippingCost.toFixed(2)} TL`}
                  </Text>
                </Group>
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
                <Group gap="xs" justify="center">
                  <IconTruck size={18} color="#16a34a" />
                  <Text
                    fz={12}
                    fw={500}
                    c="#16a34a"
                    ta="center"
                    style={{ letterSpacing: "0.05em" }}
                  >
                    7500 TL üzeri alışverişlerde ücretsiz kargo
                  </Text>
                </Group>
              </Stack>
            </Paper>
          </Box>
        </Flex>
      </Container>
    </Box>
  );
};

export default Checkout;
