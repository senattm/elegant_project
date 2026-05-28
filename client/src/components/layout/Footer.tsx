import { Container, Text, Group, Stack, Divider, Box, Anchor, ActionIcon } from "@mantine/core";
import { IconMail, IconPhone, IconMapPin, IconBrandInstagram, IconBrandPinterest } from "@tabler/icons-react";

const labelStyle = { fontSize: 10, letterSpacing: 4, textTransform: "uppercase" as const, color: "rgba(255,255,255,0.3)" };
const MAP_EMBED = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2990.6517446095927!2d28.984624476525523!3d41.03699761855743!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14cab76d30691d65%3A0x3ac95d299a2f1f34!2sIstiklal%20Cd.%2C%20Beyo%C4%9Flu%2F%C4%B0stanbul!5e0!3m2!1str!2str!4v1732561800000!5m2!1str!2str";

const FooterLink = ({ children }: { children: string }) => (
  <Anchor component="button" type="button" c="rgba(255,255,255,0.5)" size="sm" underline="hover" style={{ fontSize: 13, background: "none", border: "none", padding: 0, fontFamily: "inherit" }}>
    {children}
  </Anchor>
);

export default function Footer() {
  return (
    <Box component="footer" bg="#0a0a0a" c="rgba(255,255,255,0.45)" pos="relative" style={{ overflow: "hidden" }}>
      <Box pos="absolute" top={0} left="10%" right="10%" h={1} style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)" }} />

      <Container size="xl" py={{ base: 52, md: 72 }}>
        <Box
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 0.9fr 0.9fr",
            gap: 40,
            maxWidth: 1100,
            margin: "0 auto",
          }}
          styles={{ root: { "@media (max-width: 900px)": { gridTemplateColumns: "1fr", gap: 48 } } }}
        >
          <Box>
            <Text mb={24} style={labelStyle}>Adres</Text>
            <Box style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <Box w={160} h={110} style={{ flexShrink: 0, overflow: "hidden" }}>
                <iframe src={MAP_EMBED} width="100%" height="100%" style={{ border: 0, display: "block" }} loading="lazy" title="Konum" />
              </Box>
              <Stack gap={6} style={{ paddingTop: 2 }}>
                <Group gap={6}>
                  <IconMapPin size={14} color="rgba(255,255,255,0.35)" />
                  <Text size="xs" fw={500} c="white">Merkez Ofis</Text>
                </Group>
                <Text size="xs" lh={1.6}>İstiklal Caddesi No: 125<br />Beyoğlu / İstanbul</Text>
              </Stack>
            </Box>
          </Box>

          <Box style={{ paddingLeft: "10%" }} styles={{ root: { "@media (max-width: 900px)": { paddingLeft: 0 } } }}>
            <Text mb={24} style={labelStyle}>Yardım</Text>
            <Stack gap={12} align="flex-start">
              {["İade ve Değişim", "Sıkça Sorulan Sorular", "Bize Ulaşın"].map(item => <FooterLink key={item}>{item}</FooterLink>)}
            </Stack>
          </Box>

          <Box>
            <Text mb={24} style={labelStyle}>İletişim</Text>
            <Stack gap={14} align="flex-start">
              <Group gap={10}><IconMail size={15} color="rgba(255,255,255,0.35)" /><Text size="sm">destek@elegant.com</Text></Group>
              <Group gap={10}><IconPhone size={15} color="rgba(255,255,255,0.35)" /><Text size="sm">0532 123 45 67</Text></Group>

              <Group gap={8} mt={4}>
                {[IconBrandInstagram, IconBrandPinterest].map((Icon, idx) => (
                  <ActionIcon key={idx} variant="outline" radius={0} size="md" style={{ borderColor: "rgba(255,255,255,0.15)", color: "white" }}>
                    <Icon size={16} />
                  </ActionIcon>
                ))}
              </Group>
            </Stack>
          </Box>
        </Box>

        <Divider my={40} color="rgba(255,255,255,0.06)" />

        <Stack align="center" gap={12} c="rgba(255,255,255,0.25)">
          <Text size="xs" ta="center" style={{ letterSpacing: 0.5 }}>© {new Date().getFullYear()} ELEGANT. Tüm hakları saklıdır.</Text>
          <Group gap={16} justify="center">
            {["Gizlilik", "KVKK"].map(item => <Anchor key={item} size="xs" c="inherit" underline="hover" style={{ fontSize: 11 }}>{item}</Anchor>)}
          </Group>
        </Stack>
      </Container>
    </Box>
  );
}