import {
  Container,
  Text,
  Box,
  Group,
  ActionIcon,
  Button,
  Flex,
} from "@mantine/core";
import { IconTrash, IconMinus, IconPlus } from "@tabler/icons-react";
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

  const imageStyle = {
    width: "180px",
    height: "240px",
    objectFit: "cover" as const,
  };

  return (
    <Box mih="100vh" pt={{ base: 230, sm: 180, md: 140 }} pb={60}>
      <Container size="xl">
        <Box mb={50} ta="center">
          <Text
            fz={{ base: 28, sm: 36, md: 42 }}
            mb={12}
            style={{
              fontWeight: 300,
              letterSpacing: "0.1em",
            }}
          >
            SEPETİM
          </Text>
          <Text
            size="sm"
            c="dimmed"
            tt="uppercase"
            style={{
              fontWeight: 300,
              letterSpacing: "0.1em",
            }}
          >
            {cart.length} Ürün
          </Text>
        </Box>

        {cart.length === 0 ? (
          <Box ta="center" p="100px 20px">
            <Text fz={18} c="gray.7" mb={30}>
              Sepetiniz boş
            </Text>
            <Button variant="filled" size="md" onClick={() => navigate("/")}>
              ALIŞVERİŞE BAŞLA
            </Button>
          </Box>
        ) : (
          <>
            <Box mb={40}>
              {cart.map((item) => {
                const price =
                  typeof item.product.price === "string"
                    ? parseFloat(item.product.price)
                    : item.product.price;

                const serverUrl =
                  import.meta.env.VITE_API_URL?.replace("/api", "") ||
                  "http://localhost:5000";
                const imageUrl = item.product.images?.[0]
                  ? item.product.images[0].startsWith("http")
                    ? item.product.images[0]
                    : `${serverUrl}${item.product.images[0]}`
                  : "https://via.placeholder.com/150";

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
                      style={imageStyle}
                    />

                    <Box style={{ flex: 1 }}>
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

                    <Group gap="sm">
                      <ActionIcon
                        variant="subtle"
                        onClick={() =>
                          updateQuantity(
                            item.product.id,
                            item.quantity - 1,
                            item.selectedSize
                          )
                        }
                      >
                        <IconMinus size={18} />
                      </ActionIcon>
                      <Text w={40} ta="center" fz={16} fw={600}>
                        {item.quantity}
                      </Text>
                      <ActionIcon
                        variant="subtle"
                        onClick={() =>
                          updateQuantity(
                            item.product.id,
                            item.quantity + 1,
                            item.selectedSize
                          )
                        }
                      >
                        <IconPlus size={18} />
                      </ActionIcon>
                    </Group>

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
      </Container>
    </Box>
  );
};

export default Cart;
