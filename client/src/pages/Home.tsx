import { Container, Text, Box } from "@mantine/core";
import Hero from "../components/Hero";

const Home = () => {
  return (
    <Box>
      <Hero />
      <Box bg="black" c="white" py="md">
        <Container>
          <Text ta="center" size="sm" style={{ letterSpacing: "0.05em" }}>
            İlk alışverişinizde{" "}
            <Text
              component="span"
              fw={600}
              style={{
                borderBottom: "1px solid rgba(255,255,255,0.5)",
                paddingBottom: 2,
              }}
            >
              İLK10
            </Text>{" "}
            koduyla %10 indirim kazanın
          </Text>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
