import {
  Container,
  SimpleGrid,
  Text,
  Group,
  Stack,
  Divider,
  Box,
} from "@mantine/core";
import { IconMail, IconPhone, IconMapPin } from "@tabler/icons-react";

export default function Footer() {
  return (
    <Box component="footer" bg="black" c="white" py={48}>
      <Container size="xl" px="lg">
        <SimpleGrid
          cols={{ base: 1, sm: 1, md: 3 }}
          spacing={{ base: "xl", md: 40 }}
        >
          <Box>
            <Text
              fw={600}
              size="xl"
              mb="lg"
              style={{ letterSpacing: "0.05em" }}
            >
              Adres
            </Text>

            <Group align="flex-start" gap="md" wrap="nowrap">
              <Box
                w={150}
                h={120}
              >
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2990.6517446095927!2d28.984624476525523!3d41.03699761855743!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14cab76d30691d65%3A0x3ac95d299a2f1f34!2sIstiklal%20Cd.%2C%20Beyo%C4%9Flu%2F%C4%B0stanbul!5e0!3m2!1str!2str!4v1732561800000!5m2!1str!2str"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  title="Konum"
                />
              </Box>

              <Stack gap="xs" style={{ flex: 1 }}>
                <Group gap="xs" align="flex-start">
                  <IconMapPin
                    size={20}
                    style={{ marginTop: 2, flexShrink: 0 }}
                  />
                  <Text c="dimmed" size="sm" style={{ lineHeight: 1.6 }}>
                    İstiklal Caddesi No: 125
                    <br />
                    Kat: 1<br />
                    Taksim – Beyoğlu / İstanbul
                  </Text>
                </Group>
              </Stack>
            </Group>
          </Box>

          <Box>
            <Text
              fw={600}
              size="xl"
              mb="lg"
              style={{ letterSpacing: "0.05em" }}
            >
              İletişim
            </Text>

            <Stack gap="md">
              <Group gap="xs" align="flex-start">
                <IconMail size={20} style={{ marginTop: 2, flexShrink: 0 }} />
                <Text c="dimmed" size="sm">
                  destek@elegant.com
                </Text>
              </Group>

              <Group gap="xs" align="flex-start">
                <IconPhone size={20} style={{ marginTop: 2, flexShrink: 0 }} />
                <Text c="dimmed" size="sm">
                  0532 123 45 67
                </Text>
              </Group>
            </Stack>
          </Box>

          <Box>
            <Text
              fw={600}
              size="xl"
              mb="lg"
              style={{ letterSpacing: "0.05em" }}
            >
              Kurumsal
            </Text>

            <Stack gap="xs">
              <Text c="dimmed" size="sm" style={{ cursor: "pointer" }}>
                Hakkımızda
              </Text>
              <Text c="dimmed" size="sm" style={{ cursor: "pointer" }}>
                Sıkça Sorulan Sorular
              </Text>
              <Text c="dimmed" size="sm" style={{ cursor: "pointer" }}>
                İade ve Değişim
              </Text>
              <Text c="dimmed" size="sm" style={{ cursor: "pointer" }}>
                Gizlilik Politikası
              </Text>
              <Text c="dimmed" size="sm" style={{ cursor: "pointer" }}>
                Bize Ulaşın
              </Text>
            </Stack>
          </Box>
        </SimpleGrid>

        <Divider color="gray.8" my="xl" />

        <Text ta="center" c="dimmed" size="sm">
          © {new Date().getFullYear()} ELEGĀNT. Tüm hakları saklıdır.
        </Text>
      </Container>
    </Box>
  );
}
