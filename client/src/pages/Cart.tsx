import { Container, Text, Box, Group, ActionIcon, Button } from "@mantine/core";
import { IconTrash, IconMinus, IconPlus } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../store/hooks/useCart";

const Cart = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart();

  const total = getTotalPrice();

  return (
    <Box style={{ minHeight: "100vh", paddingTop: "140px", paddingBottom: "60px" }}>
      <Container size="xl">
        <Box style={{ marginBottom: "50px", textAlign: "center" }}>
          <Text
            style={{
              fontSize: "42px",
              fontWeight: 300,
              marginBottom: "12px",
              letterSpacing: "0.1em",
              fontFamily: "Playfair Display, serif",
            }}
          >
            SEPETİM
          </Text>
          <Text
            style={{
              fontSize: "13px",
              color: "#868e96",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {cart.length} Ürün
          </Text>
        </Box>

        {cart.length === 0 ? (
          <Box
            style={{
              textAlign: "center",
              padding: "100px 20px",
            }}
          >
            <Text
              style={{
                fontSize: "18px",
                color: "#495057",
                marginBottom: "30px",
              }}
            >
              Sepetiniz boş
            </Text>
            <Button
              variant="filled"
              color="dark"
              size="md"
              onClick={() => navigate("/")}
              style={{
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Alışverişe Başla
            </Button>
          </Box>
        ) : (
          <>
            <Box style={{ marginBottom: "40px" }}>
              {cart.map((item) => {
                const price = typeof item.product.price === "string" 
                  ? parseFloat(item.product.price) 
                  : item.product.price;
                
                const serverUrl = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";
                const imageUrl = item.product.images?.[0] 
                  ? (item.product.images[0].startsWith("http") 
                      ? item.product.images[0] 
                      : `${serverUrl}${item.product.images[0]}`)
                  : "https://via.placeholder.com/150";

                return (
                  <Box
                    key={`${item.product.id}-${item.selectedSize}`}
                    style={{
                      display: "flex",
                      gap: "20px",
                      padding: "20px",
                      borderBottom: "1px solid #e9ecef",
                      alignItems: "center",
                    }}
                  >
                    <img
                      src={imageUrl}
                      alt={item.product.name}
                      style={{
                        width: "120px",
                        height: "160px",
                        objectFit: "cover",
                      }}
                    />

                    <Box style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: "16px",
                          fontWeight: 500,
                          marginBottom: "8px",
                        }}
                      >
                        {item.product.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: "13px",
                          color: "#868e96",
                          marginBottom: "8px",
                          textTransform: "uppercase",
                        }}
                      >
                        Beden: {item.selectedSize}
                      </Text>
                      <Text
                        style={{
                          fontSize: "16px",
                          fontWeight: 600,
                        }}
                      >
                        {price.toFixed(2)} TL
                      </Text>
                    </Box>

                    <Group gap="xs">
                      <ActionIcon
                        variant="subtle"
                        color="dark"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.selectedSize)}
                      >
                        <IconMinus size={16} />
                      </ActionIcon>
                      <Text
                        style={{
                          minWidth: "30px",
                          textAlign: "center",
                          fontSize: "14px",
                          fontWeight: 500,
                        }}
                      >
                        {item.quantity}
                      </Text>
                      <ActionIcon
                        variant="subtle"
                        color="dark"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedSize)}
                      >
                        <IconPlus size={16} />
                      </ActionIcon>
                    </Group>

                    <Text
                      style={{
                        fontSize: "16px",
                        fontWeight: 600,
                        minWidth: "100px",
                        textAlign: "right",
                      }}
                    >
                      {(price * item.quantity).toFixed(2)} TL
                    </Text>

                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => removeFromCart(item.product.id, item.selectedSize)}
                    >
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Box>
                );
              })}
            </Box>

            <Box
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "30px",
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
              }}
            >
              <Box>
                <Text
                  style={{
                    fontSize: "14px",
                    color: "#868e96",
                    marginBottom: "4px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Toplam
                </Text>
                <Text
                  style={{
                    fontSize: "32px",
                    fontWeight: 600,
                  }}
                >
                  {total.toFixed(2)} TL
                </Text>
              </Box>

              <Group gap="md">
                <Button
                  variant="outline"
                  color="dark"
                  size="lg"
                  onClick={clearCart}
                  style={{
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  Sepeti Temizle
                </Button>
                <Button
                  variant="filled"
                  color="dark"
                  size="lg"
                  style={{
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  Ödemeye Geç
                </Button>
              </Group>
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
};

export default Cart;
