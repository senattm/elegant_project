import { Box, Text, Button } from "@mantine/core";
import type { ReactNode } from "react";

interface EmptyStateProps {
  message: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
  py?: number;
}

const EmptyState = ({
  message,
  description,
  actionLabel,
  onAction,
  icon,
  py = 100,
}: EmptyStateProps) => {
  return (
    <Box ta="center" p={`${py}px 20px`}>
      {icon}
      <Text fz={18} c="gray.7" mb={description ? 10 : 30}>
        {message}
      </Text>
      {description && (
        <Text size="sm" c="#adb5bd" mb={30}>
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button variant="filled" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};

export default EmptyState;

