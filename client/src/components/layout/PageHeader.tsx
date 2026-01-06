import { Box, Title, Text } from "@mantine/core";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string | ReactNode;
  mb?: number | { base?: number; sm?: number; md?: number };
}

const PageHeader = ({ title, subtitle, mb = 60 }: PageHeaderProps) => {
  return (
    <Box mb={mb} ta="center">
      <Title
        order={2}
        fz={{ base: 32, sm: 40, md: 48 }}
        mb={subtitle ? 12 : 0}
      >
        {title}
      </Title>
      {subtitle && (
        <Text
          fz="sm"
          c="dimmed"
          style={{
            fontWeight: 300,
            letterSpacing: "0.1em",
          }}
        >
          {subtitle}
        </Text>
      )}
    </Box>
  );
};

export default PageHeader;

