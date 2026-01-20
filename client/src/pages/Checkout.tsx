import { Container, Box, Flex, Stack, Divider, Button, Group, Title } from "@mantine/core";
import { useCheckout } from "../hooks/useCheckout";
import AddressSection from "../components/checkout/AddressSection";
import PaymentSection from "../components/checkout/PaymentSection";
import OrderSummary from "../components/checkout/OrderSummary";

const Checkout = () => {
  const {
    cart,
    paymentData,
    setPaymentData,
    addressData,
    setAddressData,
    savedAddresses,
    selectedAddressId,
    setSelectedAddressId,
    useNewAddress,
    setUseNewAddress,
    savedPaymentMethods,
    selectedPaymentMethodId,
    setSelectedPaymentMethodId,
    useNewPaymentMethod,
    setUseNewPaymentMethod,
    savePaymentMethod,
    setSavePaymentMethod,
    errors,
    isCreatingOrder,
    isFirstOrder,
    total,
    discount,
    shippingCost,
    finalTotal,
    formatCardNumber,
    formatExpiryDate,
    formatCVV,
    formatPhone,
    handleSubmit,
    navigate,
  } = useCheckout();

  const getImageUrl = (imageUrl: string) => {
    const serverUrl =
      import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";
    return imageUrl?.startsWith("http") ? imageUrl : `${serverUrl}${imageUrl}`;
  };

  const handleAddressChange = (field: string, value: string) => {
    setAddressData({ ...addressData, [field]: value });
  };

  const handlePaymentChange = (field: string, value: string) => {
    setPaymentData({ ...paymentData, [field]: value });
  };

  const handleSelectPaymentMethod = (id: string | null, method?: any) => {
    setSelectedPaymentMethodId(id);
    if (method) {
      setPaymentData({
        cardNumber: `000000000000${method.card_last4}`,
        cardHolderName: method.card_holder,
        expiryDate: method.expiry_date || "",
        cvv: "",
      });
    }
  };

  return (
    <Box mih="100vh" pt={{ base: 230, sm: 180, md: 140 }} pb={60}>
      <Container size="xl">
        <Title order={1} mb="xl" ta="center">
          ÖDEME
        </Title>

        <Flex direction={{ base: "column", md: "row" }} gap="xl">
          <Stack flex={1} gap="xl">
            <AddressSection
              savedAddresses={savedAddresses}
              selectedAddressId={selectedAddressId}
              onSelectAddress={setSelectedAddressId}
              useNewAddress={useNewAddress}
              onToggleNewAddress={() => setUseNewAddress(!useNewAddress)}
              addressData={addressData}
              onAddressChange={handleAddressChange}
              errors={errors}
              formatPhone={formatPhone}
            />

            <Divider />

            <PaymentSection
              savedPaymentMethods={savedPaymentMethods}
              selectedPaymentMethodId={selectedPaymentMethodId}
              onSelectPaymentMethod={handleSelectPaymentMethod}
              useNewPaymentMethod={useNewPaymentMethod}
              onToggleNewPaymentMethod={() => setUseNewPaymentMethod(!useNewPaymentMethod)}
              paymentData={paymentData}
              onPaymentChange={handlePaymentChange}
              savePaymentMethod={savePaymentMethod}
              onToggleSavePaymentMethod={() => setSavePaymentMethod(!savePaymentMethod)}
              errors={errors}
              formatCardNumber={formatCardNumber}
              formatExpiryDate={formatExpiryDate}
              formatCVV={formatCVV}
            />

            <Group justify="space-between">
              <Button variant="outline" onClick={() => navigate("/cart")}>
                Sepete Dön
              </Button>
              <Button
                onClick={handleSubmit}
                loading={isCreatingOrder}
                disabled={cart.length === 0}
              >
                Siparişi Tamamla
              </Button>
            </Group>
          </Stack>

          <OrderSummary
            cart={cart}
            total={total}
            discount={discount}
            shippingCost={shippingCost}
            finalTotal={finalTotal}
            isFirstOrder={isFirstOrder}
            getImageUrl={getImageUrl}
          />
        </Flex>
      </Container>
    </Box>
  );
};

export default Checkout;
