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
  Indicator,
  rem,
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

  const isDark = !alwaysWhite && !isScrolled;
  const textColor = isDark ? "white" : "black";
  const bgColor = isDark ? "transparent" : "white";

  return (
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
        transition: "all 0.3s ease",
        boxShadow: !isDark ? "0 2px 10px rgba(0,0,0,0.1)" : "none",
      }}
      py={isScrolled ? rem(16) : rem(24)}
    >
      <Container size="xl" px="xl">
        <Group justify="space-between" align="center">
          <UnstyledButton onClick={() => { navigate("/"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
            <Text
              fz={{ base: rem(28), sm: rem(34), md: rem(45) }}
              fw={400}
              c={textColor}
              style={{
                fontFamily: "Playfair Display, serif",
                letterSpacing: "0.15em",
                lineHeight: 1,
              }}
            >
              ELEGĀNT
            </Text>
          </UnstyledButton>

          <Group gap={rem(45)} visibleFrom="md">
            {["Ana Sayfa", "Mağaza", "İletişim"].map((item) => (
              <Anchor
                key={item}
                c={textColor}
                fw={400}
                onClick={() => item === "İletişim" ? document.querySelector("footer")?.scrollIntoView({ behavior: "smooth" }) : navigate(item === "Mağaza" ? "/store" : "/")}
                style={{
                  textDecoration: "none",
                  fontSize: rem(20),
                  letterSpacing: "0.05em",
                  cursor: "pointer",
                }}
              >
                {item}
              </Anchor>
            ))}
          </Group>

          <Group gap="sm">
            {searchOpen ? (
              <TextInput
                placeholder="Ara..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.trim()) navigate("/store");
                }}
                onBlur={() => !searchQuery.trim() && setSearchOpen(false)}
                leftSection={<IconSearch size={22} stroke={2} />}
                autoFocus
                w={{ base: 180, md: 260 }}
                variant="unstyled"
                styles={{
                  input: {
                    backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "#f1f3f5",
                    color: textColor,
                    borderRadius: 0, // Arama kutusunu da kare yaptık (isteğe bağlı)
                    paddingLeft: rem(40),
                    paddingRight: rem(15),
                    height: rem(45),
                  },
                }}
              />
            ) : (
              <ActionIcon variant="subtle" color={textColor} size="xl" onClick={() => setSearchOpen(true)}>
                <IconSearch size={28} stroke={2} />
              </ActionIcon>
            )}

            <Indicator 
              label={favorites.length} 
              disabled={favorites.length === 0} 
              color="#e63946" 
              size={16} 
              offset={2}
              styles={{ indicator: { fontSize: rem(9), fontWeight: 600, border: "none", borderRadius: 0 } }}
            >
              <ActionIcon variant="subtle" color={textColor} size="xl" onClick={() => navigate("/favorites")}>
                <IconHeart size={28} stroke={2} />
              </ActionIcon>
            </Indicator>

            <Indicator 
              label={cartCount} 
              disabled={cartCount === 0} 
              color="#e63946" 
              size={16} 
              offset={2}
              styles={{ indicator: { fontSize: rem(9), fontWeight: 600, border: "none", borderRadius: 0 } }}
            >
              <ActionIcon variant="subtle" color={textColor} size="xl" onClick={() => navigate("/cart")}>
                <IconShoppingBag size={28} stroke={2} />
              </ActionIcon>
            </Indicator>

            <Menu 
              shadow="md" 
              width={240} 
              radius={0} // Menü dış çerçevesini kare yapar
              styles={{ 
                dropdown: { border: "none", borderRadius: 0 },
                item: { borderRadius: 0 } // İçindeki öğelerin hover arka planını kare yapar
              }}
            >
              <Menu.Target>
                <ActionIcon variant="subtle" color={textColor} size="xl">
                  <IconUser size={28} stroke={2} />
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                {isAuthenticated ? (
                  <>
                    <Menu.Label>{user?.name || user?.email}</Menu.Label>
                    <Menu.Item leftSection={<IconUserCircle size={22} stroke={1.5} />} onClick={() => navigate("/profile")}>Profilim</Menu.Item>
                    <Menu.Item leftSection={<IconPackage size={22} stroke={1.5} />} onClick={() => navigate("/orders")}>Siparişlerim</Menu.Item>
                    <Menu.Divider />
                    <Menu.Item color="red" leftSection={<IconLogout size={22} stroke={1.5} />} onClick={() => { logout(); navigate("/"); }}>Çıkış Yap</Menu.Item>
                  </>
                ) : (
                  <Menu.Item 
                    leftSection={<IconUser size={22} stroke={2} />} 
                    onClick={() => navigate("/auth")}
                  >
                    Giriş Yap
                  </Menu.Item>
                )}
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </Container>
    </Box>
  );
}