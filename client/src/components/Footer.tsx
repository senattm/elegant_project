import {
  Container,
  SimpleGrid,
  Text,
  Group,
  Stack,
  Divider,
  Box,
  Anchor,
  ActionIcon,
} from "@mantine/core";
import {
  IconMail,
  IconPhone,
  IconMapPin,
  IconBrandInstagram,
  IconBrandTwitter,
  IconBrandYoutube,
} from "@tabler/icons-react";

export default function Footer() {
  return (
    <Box component="footer" bg="black" c="white" py="xl">
      <Container size="xl">
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
          <Box>
            <Text fw={700} size="md" mb="xs" c="white" tt="uppercase">
              ADRES
            </Text>

            <Group align="flex-start" gap="md" wrap="nowrap">
              <Box w={150} h={120}>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2990.6517446095927!2d28.984624476525523!3d41.03699761855743!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14cab76d30691d65%3A0x3ac95d299a2f1f34!2sIstiklal%20Cd.%2C%20Beyo%C4%9Flu%2F%C4%B0stanbul!5e0!3m2!1str!2str!4v1732561800000!5m2!1str!2str"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  title="Konum"
                />
              </Box>

              <Stack gap={4}>
                <Group gap={6} align="center">
                  <IconMapPin size={16} color="gray" />
                  <Text c="dimmed" size="xs" fw={500}>
                    Merkez Ofis
                  </Text>
                </Group>
                <Text c="dimmed" size="xs" lh={1.4}>
                  İstiklal Caddesi No: 125
                  <br />
                  Beyoğlu / İstanbul
                </Text>
              </Stack>
            </Group>
          </Box>

          <Box>
            <Text fw={700} size="md" mb="xs" c="white" tt="uppercase">
              İLETİŞİM
            </Text>

            <Stack gap="xs">
              <Group gap="xs">
                <IconMail size={18} color="gray" />
                <Text c="dimmed" size="sm">
                  destek@elegant.com
                </Text>
              </Group>

              <Group gap="xs">
                <IconPhone size={18} color="gray" />
                <Text c="dimmed" size="sm">
                  0532 123 45 67
                </Text>
              </Group>

              <Group gap="l" mt={5}>
                <ActionIcon variant="subtle" color="gray">
                  <IconBrandInstagram />
                </ActionIcon>
                <ActionIcon variant="subtle" color="gray">
                  <IconBrandTwitter />
                </ActionIcon>
                <ActionIcon variant="subtle" color="gray">
                  <IconBrandYoutube />
                </ActionIcon>
              </Group>
            </Stack>
          </Box>

          <Box>
            <Text fw={700} size="md" mb="xs" c="white" tt="uppercase">
              KURUMSAL
            </Text>

            <Stack gap={4}>
              {[
                "Hakkımızda",
                "Sıkça Sorulan Sorular",
                "İade ve Değişim",
                "Bize Ulaşın",
              ].map((item) => (
                <Anchor
                  key={item}
                  c="dimmed"
                  size="sm"
                  underline="hover"
                  style={{ transition: "color 0.2s", width: "fit-content" }}
                >
                  {item}
                </Anchor>
              ))}
            </Stack>
          </Box>
        </SimpleGrid>

        <Divider color="gray.9" my="lg" />

        <Text ta="center" c="dimmed" size="sm">
          © {new Date().getFullYear()} ELEGĀNT. Tüm hakları saklıdır.
        </Text>
      </Container>
    </Box>
  );
}
