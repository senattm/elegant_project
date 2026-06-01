import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { chatbotApi } from "../../api/client";
import { getImageUrl } from "../../utils/imageUrl";
import {
  Box,
  Text,
  TextInput,
  ActionIcon,
  ScrollArea,
  Paper,
  Group,
  Stack,
  Avatar,
  rem,
  UnstyledButton,
  Image,
} from "@mantine/core";
import {
  IconMessageCircle,
  IconX,
  IconSend,
  IconUser,
} from "@tabler/icons-react";

interface ProductRecommendation {
  id: number;
  name: string;
  price: number;
  image: string | null;
  category: string | null;
  style?: string | null;
  season?: string | null;
}

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  recommendations?: ProductRecommendation[];
}

const Chatbot = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Merhaba! Size yardımcı olmak için buradayım.",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const viewport = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    viewport.current?.scrollTo({
      top: viewport.current.scrollHeight,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await chatbotApi.sendMessage(userMessage.text);
      const { message, action, path, recommendations } = response.data;

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: message || "Üzgünüm, bir hata oluştu.",
        sender: "bot",
        timestamp: new Date(),
        recommendations: action === "recommend" ? recommendations : undefined,
      };
      setMessages((prev) => [...prev, botMessage]);

      if (action === "redirect" && path) {
        setTimeout(() => {
          navigate(path);
          setIsOpen(false);
        }, 1500);
      }
    } catch (error) {
      console.error("Chatbot error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Üzgünüm, şu anda yanıt veremiyorum.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            style={{
              position: "fixed",
              bottom: rem(48),
              right: rem(48),
              zIndex: 1000,
            }}
          >
            <ActionIcon
              variant="white"
              size={64}
              radius="xl"
              onClick={() => setIsOpen(true)}
              style={{
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                backgroundColor: "#fff",
                color: "#000",
              }}
            >
              <IconMessageCircle size={28} />
            </ActionIcon>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <Paper
            component={motion.div}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            withBorder
            shadow="lg"
            style={{
              position: "fixed",
              bottom: rem(32),
              right: rem(32),
              width: rem(360),
              height: rem(480),
              zIndex: 1001,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <Group
              justify="space-between"
              p="md"
              style={{
                backgroundColor: "#fff",
                borderBottom: "1px solid #000",
              }}
            >
              <Group gap="sm">
                <Avatar
                  size={36}
                  radius="xl"
                  style={{
                    backgroundColor: "#000",
                    border: "1px solid #000",
                  }}
                >
                  <IconUser size={20} color="#fff" />
                </Avatar>
                <Stack gap={0}>
                  <Text size="xs" fw={600} c="#000" lts={0.5}>
                    ELEGĀNT ASİSTAN
                  </Text>
                  <Text size="xs" c="#999">
                    Çevrimiçi
                  </Text>
                </Stack>
              </Group>
              <ActionIcon
                variant="subtle"
                onClick={() => setIsOpen(false)}
                style={{ color: "#000" }}
              >
                <IconX size={20} />
              </ActionIcon>
            </Group>

            <ScrollArea viewportRef={viewport} flex={1} p="md" style={{ backgroundColor: "#fff" }}>
              <Stack gap="md">
                {messages.map((message) => (
                  <Box
                    key={message.id}
                    style={{
                      alignSelf:
                        message.sender === "user" ? "flex-end" : "flex-start",
                      maxWidth: message.recommendations?.length ? "100%" : "85%",
                      width: message.recommendations?.length ? "100%" : undefined,
                    }}
                  >
                    <Paper
                      px="md"
                      py="xs"
                      bg={message.sender === "user" ? "#000" : "#f5f5f0"}
                      c={message.sender === "user" ? "#fff" : "#333"}
                      style={{
                        borderRadius:
                          message.sender === "user"
                            ? "16px 16px 4px 16px"
                            : "16px 16px 16px 4px",
                        border: message.sender === "bot" ? "1px solid #e8e8e3" : "none",
                      }}
                    >
                      <Text size="sm" style={{ wordBreak: "break-word" }}>
                        {message.text}
                      </Text>
                    </Paper>

                    {message.recommendations && message.recommendations.length > 0 && (
                      <Stack gap="xs" mt="sm">
                        {message.recommendations.map((item) => (
                          <UnstyledButton
                            key={item.id}
                            onClick={() => {
                              navigate(`/product/${item.id}`);
                              setIsOpen(false);
                            }}
                            style={{ width: "100%" }}
                          >
                            <Paper
                              p="xs"
                              withBorder
                              radius={0}
                              style={{
                                borderColor: "#e8e8e3",
                                transition: "border-color 0.2s",
                              }}
                            >
                              <Group gap="sm" wrap="nowrap" align="center">
                                <Box
                                  w={52}
                                  h={68}
                                  style={{ overflow: "hidden", flexShrink: 0, background: "#fafafa" }}
                                >
                                  <Image
                                    src={getImageUrl(item.image)}
                                    alt={item.name}
                                    fit="cover"
                                    h="100%"
                                    w="100%"
                                  />
                                </Box>
                                <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                                  <Text size="sm" fw={500} lineClamp={2}>
                                    {item.name}
                                  </Text>
                                  <Text size="sm" fw={600}>
                                    {item.price.toFixed(2)} TL
                                  </Text>
                                </Stack>
                              </Group>
                            </Paper>
                          </UnstyledButton>
                        ))}
                      </Stack>
                    )}
                  </Box>
                ))}
              </Stack>
            </ScrollArea>

            <Group
              p="xs"
              style={{ borderTop: "1px solid #000", backgroundColor: "#fff" }}
            >
              <TextInput
                placeholder=""
                flex={1}
                value={inputValue}
                onChange={(e) => setInputValue(e.currentTarget.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                styles={{
                  input: {
                    borderRadius: rem(24),
                    fontSize: rem(13),
                  },
                }}
              />
              <ActionIcon
                size={40}
                radius="xl"
                variant="filled"
                bg="#000"
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                loading={isLoading}
                style={{
                  opacity: inputValue.trim() && !isLoading ? 1 : 0.5,
                }}
              >
                <IconSend size={18} />
              </ActionIcon>
            </Group>
          </Paper>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;
