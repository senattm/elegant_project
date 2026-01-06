import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Box,
  Container,
  Group,
  Text,
  ActionIcon,
  Menu,
  UnstyledButton,
  Anchor,
  TextInput,
} from "@mantine/core";
import {
  IconSearch,
  IconHeart,
  IconShoppingBag,
  IconUser,
  IconUserCircle,
  IconPackage,
  IconLogout,
} from "@tabler/icons-react";
import { useAuth } from "../../store/hooks";
import { useFavorites } from "../../store/hooks/useFavorites";
import { useCart } from "../../store/hooks/useCart";
import { useAtom } from "jotai";
import { searchQueryAtom } from "../../store/atoms";

interface NavbarProps {
  alwaysWhite?: boolean;
}

export default function Navbar({ alwaysWhite = false }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom);
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { favorites } = useFavorites();
  const { cartCount } = useCart();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 100);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const bgColor = alwaysWhite || isScrolled ? "white" : "transparent";
  const textColor = alwaysWhite || isScrolled ? "black" : "white";

  const iconStyle = {
    position: "relative" as const,
  };

  const badgeStyle = {
    position: "absolute" as const,
    top: 0,
    right: 0,
    backgroundColor: "#e63946",
    color: "white",
    borderRadius: "50%",
    width: "16px",
    height: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "9px",
    fontWeight: 600,
  };

  return (
    <>
      <Box
        component={motion.nav}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4 }}
        pos="fixed"
        top={0}
        left={0}
        right={0}
        style={{
          zIndex: 100,
          backgroundColor: bgColor,
          transition: "all 0.3s",
          boxShadow:
            alwaysWhite || isScrolled ? "0 2px 10px rgba(0,0,0,0.1)" : "none",
        }}
        py={isScrolled ? { base: "sm", md: "lg" } : { base: "md", md: "xl" }}
      >
        <Container size="xl" px={{ base: "md", md: "xl" }}>
          <Group justify="space-between" align="center">
            <UnstyledButton
              onClick={() => {
                navigate("/");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <Text
                fz={{ base: "2.2rem", sm: "2.5rem", md: "2.8rem" }}
                fw={400}
                c={textColor}
                style={{
                  fontFamily: "Playfair Display, serif",
                  letterSpacing: "0.15em",
                }}
              >
                ELEGĀNT
              </Text>
            </UnstyledButton>

            <Group gap="xl" visibleFrom="md">
              <Anchor
                c={textColor}
                onClick={() => {
                  navigate("/");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                style={{
                  textDecoration: "none",
                  fontSize: "1.2rem",
                  letterSpacing: "0.05em",
                  cursor: "pointer",
                }}
              >
                Ana Sayfa
              </Anchor>

              <Anchor
                c={textColor}
                onClick={() => navigate("/store")}
                style={{
                  textDecoration: "none",
                  fontSize: "1.2rem",
                  letterSpacing: "0.05em",
                  cursor: "pointer",
                }}
              >
                Mağaza
              </Anchor>

              <Anchor
                c={textColor}
                onClick={() => {
                  const footer = document.querySelector("footer");
                  footer?.scrollIntoView({ behavior: "smooth" });
                }}
                style={{
                  textDecoration: "none",
                  fontSize: "1.2rem",
                  letterSpacing: "0.05em",
                  cursor: "pointer",
                }}
              >
                İletişim
              </Anchor>
            </Group>

            <Group gap="sm">
              {searchOpen ? (
                <TextInput
                  placeholder="Ara..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.trim()) {
                      navigate("/store");
                    }
                  }}
                  onBlur={() => {
                    if (!searchQuery.trim()) {
                      setSearchOpen(false);
                    }
                  }}
                  leftSection={<IconSearch size={18} />}
                  styles={{
                    input: {
                      backgroundColor: alwaysWhite || isScrolled ? "white" : "rgba(255,255,255,0.1)",
                      border: `1px solid ${alwaysWhite || isScrolled ? "#e0e0e0" : "rgba(255,255,255,0.3)"}`,
                      color: textColor,
                      "&::placeholder": {
                        color: alwaysWhite || isScrolled ? "#999" : "rgba(255,255,255,0.7)",
                      },
                    },
                  }}
                  w={{ base: 180, sm: 220, md: 250 }}
                  autoFocus
                />
              ) : (
                <ActionIcon
                  variant="subtle"
                  color={textColor}
                  size="xl"
                  onClick={() => setSearchOpen(true)}
                >
                  <IconSearch size={28} />
                </ActionIcon>
              )}

              <ActionIcon
                variant="subtle"
                color={textColor}
                size="xl"
                onClick={() => navigate("/favorites")}
                style={iconStyle}
              >
                <IconHeart size={28} />
                {favorites.length > 0 && (
                  <Box style={badgeStyle}>{favorites.length}</Box>
                )}
              </ActionIcon>

              <ActionIcon
                variant="subtle"
                color={textColor}
                size="xl"
                onClick={() => navigate("/cart")}
                style={iconStyle}
              >
                <IconShoppingBag size={28} />
                {cartCount > 0 && <Box style={badgeStyle}>{cartCount}</Box>}
              </ActionIcon>

              <Menu shadow="md" width={240}>
                <Menu.Target>
                  <ActionIcon variant="subtle" color={textColor} size="xl">
                    <IconUser size={28} />
                  </ActionIcon>
                </Menu.Target>

                <Menu.Dropdown>
                  {isAuthenticated ? (
                    <>
                      <Menu.Label>{user?.name || user?.email}</Menu.Label>
                      <Menu.Item
                        leftSection={<IconUserCircle size={22} />}
                        onClick={() => navigate("/profile")}
                      >
                        Profilim
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconPackage size={22} />}
                        onClick={() => navigate("/orders")}
                      >
                        Siparişlerim
                      </Menu.Item>
                      <Menu.Divider />
                      <Menu.Item
                        color="red"
                        leftSection={<IconLogout size={22} />}
                        onClick={() => {
                          logout();
                          navigate("/");
                        }}
                      >
                        Çıkış Yap
                      </Menu.Item>
                    </>
                  ) : (
                    <>
                      <Menu.Label>Hesap</Menu.Label>
                      <Menu.Item
                        leftSection={<IconUser size={22} />}
                        onClick={() => navigate("/auth")}
                      >
                        Giriş Yap
                      </Menu.Item>
                    </>
                  )}
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Group>
        </Container>
    </Box>
  </>
  );
}
