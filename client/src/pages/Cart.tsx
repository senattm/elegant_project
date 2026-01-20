import {
  Text,
  Box,
  Group,
  ActionIcon,
  Button,
  Flex,
} from "@mantine/core";
import PageLayout from "../components/layout/PageLayout";
import PageHeader from "../components/layout/PageHeader";
import EmptyState from "../components/ui/EmptyState";
import QuantitySelector from "../components/ui/QuantitySelector";
import { getImageUrl } from "../utils/imageUrl";
import { IconTrash } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../store/hooks";
import { useAtom } from "jotai";
import { isAuthenticatedAtom } from "../store/atoms";
import { useEffect } from "react";

const Cart = () => {
  const navigate = useNavigate();
  const [isAuthenticated] = useAtom(isAuthenticatedAtom);
  const {
    cart,
    removeFromCart,
    updateQuantity,
    getTotalPrice,
    clearCart,
    fetchCart,
  } = useCart();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated]);

  const total = getTotalPrice();

  const handleCheckout = () => {
    if (cart.length === 0) return;
    navigate("/checkout");
  };



  return (
    <PageLayout pt={{ base: 230, sm: 180, md: 140 }} pb={60}>
      <PageHeader
        title="SEPETİM"
        subtitle={`${cart.length} Ürün`}
        mb={50}
      />

      {cart.length === 0 ? (
        <EmptyState
          message="Sepetiniz boş"
          actionLabel="ALIŞVERİŞE BAŞLA"
          onAction={() => navigate("/")}
        />
      ) : (
        <>
          <Box mb={40}>
            {cart.map((item) => {
              const price =
                typeof item.product.price === "string"
                  ? parseFloat(item.product.price)
                  : item.product.price;

              const imageUrl = getImageUrl(item.product.images?.[0]);

              return (
                <Flex
                  key={`${item.product.id}-${item.selectedSize}`}
                  gap={30}
                  p="30px 20px"
                  align="center"
                  style={{ borderBottom: "1px solid #e9ecef" }}
                >
                  <img
                    src={imageUrl}
                    alt={item.product.name}
                    width="180"
                    height="240"
                    style={{ objectFit: "cover" }}
                  />

                  <Box flex={1}>
                    <Text fz={18} fw={500} mb={12}>
                      {item.product.name}
                    </Text>
                    <Text fz={14} c="dimmed" mb={12}>
                      BEDEN: {item.selectedSize}
                    </Text>
                    <Text fz={18} fw={600}>
                      {price.toFixed(2)} TL
                    </Text>
                  </Box>

                  <QuantitySelector
                    value={item.quantity}
                    onChange={(newQuantity) =>
                      updateQuantity(
                        item.product.id,
                        newQuantity,
                        item.selectedSize
                      )
                    }
                    min={1}
                  />

                  <Text fz={18} fw={600} w={120} ta="right">
                    {(price * item.quantity).toFixed(2)} TL
                  </Text>

                  <ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={() =>
                      removeFromCart(item.product.id, item.selectedSize)
                    }
                  >
                    <IconTrash />
                  </ActionIcon>
                </Flex>
              );
            })}
          </Box>

          <Flex justify="space-between">
            <Box>
              <Text c="dimmed">TOPLAM</Text>
              <Text fz={32} fw={600}>
                {total.toFixed(2)} TL
              </Text>
            </Box>

            <Group gap="md">
              <Button variant="outline" onClick={clearCart}>
                SEPETİ TEMİZLE
              </Button>
              <Button variant="filled" onClick={handleCheckout}>
                ÖDEMEYE GEÇ
              </Button>
            </Group>
          </Flex>
        </>
      )}
    </PageLayout>
  );
};

export default Cart;
