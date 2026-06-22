import { Box, Container } from "@mantine/core";
import type { ReactNode } from "react";

interface PageLayoutProps {
  children: ReactNode;
  pt?: { base?: number; sm?: number; md?: number } | number;
  pb?: number;
  mih?: string | number;
}

const PageLayout = ({
  children,
  pt = { base: 250, sm: 180, md: 140 },
  pb = 80,
  mih = "100vh",
}: PageLayoutProps) => {
  return (
    <Box mih={mih} pt={pt} pb={pb}>
      <Container size="xl">{children}</Container>
    </Box>
  );
};

export default PageLayout;

