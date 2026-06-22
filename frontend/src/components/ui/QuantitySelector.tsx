import { Group, ActionIcon, Text } from "@mantine/core";
import { IconMinus, IconPlus } from "@tabler/icons-react";

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md" | "lg";
}

const QuantitySelector = ({
  value,
  onChange,
  min = 1,
  max,
  size = "md",
}: QuantitySelectorProps) => {
  const iconSize = size === "sm" ? 16 : size === "lg" ? 20 : 18;
  const textSize = size === "sm" ? 14 : size === "lg" ? 20 : 16;
  const width = size === "sm" ? 32 : size === "lg" ? 50 : 40;

  const handleDecrease = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrease = () => {
    if (!max || value < max) {
      onChange(value + 1);
    }
  };

  return (
    <Group gap="sm">
      <ActionIcon
        variant="subtle"
        onClick={handleDecrease}
        disabled={value <= min}
        c="black"
      >
        <IconMinus size={iconSize} />
      </ActionIcon>
      <Text w={width} ta="center" fz={textSize} fw={600}>
        {value}
      </Text>
      <ActionIcon
        variant="subtle"
        onClick={handleIncrease}
        disabled={max ? value >= max : false}
        c="black"
      >
        <IconPlus size={iconSize} />
      </ActionIcon>
    </Group>
  );
};

export default QuantitySelector;
