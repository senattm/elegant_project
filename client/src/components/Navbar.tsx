import { useEffect, useState } from "react";
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

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 100);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const bgColor = isScrolled ? "white" : "transparent";
  const textColor = isScrolled ? "black" : "white";

  const noOutlineStyle = {
    border: "none",
    outline: "none",
    boxShadow: "none",
  };

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
        transition: "all 0.3s",
        boxShadow: isScrolled ? "0 2px 10px rgba(0,0,0,0.1)" : "none",
      }}
      py={isScrolled ? "lg" : "xl"}
    >
      <Container size="xl">
        <Group justify="space-between" align="center">
          <UnstyledButton>
            <Text
              fz="2.8rem"
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

          <Group gap="xl">
            <Anchor
              c={textColor}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
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
              style={{
                ...noOutlineStyle, 
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
                ...noOutlineStyle, 
                textDecoration: "none",
                fontSize: "1.2rem",
                letterSpacing: "0.05em",
                cursor: "pointer",
              }}
            >
              İletişim
            </Anchor>
          </Group>

          <Group gap="lg">
            
            <ActionIcon 
              variant="subtle" 
              color={textColor} 
              size="xl" 
              style={noOutlineStyle}    
            >
              <IconSearch size={28} />
            </ActionIcon>

            <ActionIcon 
              variant="subtle" 
              color={textColor} 
              size="xl"
              style={noOutlineStyle}
            >
              <IconHeart size={28} />
            </ActionIcon>

            <ActionIcon 
              variant="subtle" 
              color={textColor} 
              size="xl"
              style={noOutlineStyle}
            >
              <IconShoppingBag size={28} />
            </ActionIcon>

            <Menu shadow="md" width={240}>
              <Menu.Target>
                <ActionIcon 
                  variant="subtle" 
                  color={textColor} 
                  size="xl"
                  style={noOutlineStyle}
                >
                  <IconUser size={28} />
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>Kullanıcı</Menu.Label>
                <Menu.Item leftSection={<IconUserCircle size={22} />}>
                  Profilim
                </Menu.Item>
                <Menu.Item leftSection={<IconPackage size={22} />}>
                  Siparişlerim
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item color="red" leftSection={<IconLogout size={22} />}>
                  Çıkış Yap
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </Container>
    </Box>
  );
}