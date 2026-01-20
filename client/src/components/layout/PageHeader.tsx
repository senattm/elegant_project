import { Box, Title, Text } from "@mantine/core";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string | ReactNode;
  mb?: number | { base?: number; sm?: number; md?: number };
  align?: "left" | "center" | "right";
  size?: "sm" | "md" | "lg";
}

const PageHeader = ({
  title,
  subtitle,
  mb = 60,
  align = "center",
  size = "lg",
}: PageHeaderProps) => {
  const getFontSize = () => {
    switch (size) {
      case "sm":
        return { base: 24, sm: 32 };
      case "md":
        return { base: 28, sm: 36 };
      case "lg":
      default:
        return { base: 32, sm: 40, md: 48 };
    }
  };

  return (
    <Box mb={mb} ta={align}>
      <Title
        order={2}
        fz={getFontSize()}
        mb={subtitle ? 8 : 0}
      >
        {title}
      </Title>
      {subtitle && (
        <Text
          fz="sm"
          c="dimmed"
          fw={300}
          style={{
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

