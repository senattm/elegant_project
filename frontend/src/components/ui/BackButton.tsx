import { UnstyledButton, Text } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

interface BackButtonProps {
  onClick?: () => void;
  label?: string;
  mb?: number;
}

const BackButton = ({ onClick, label = "Geri", mb = 30 }: BackButtonProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(-1);
    }
  };

  return (
    <UnstyledButton
      onClick={handleClick}
      mb={mb}
      style={{ display: "flex", alignItems: "center", gap: 8 }}
    >
      <IconArrowLeft size={20} />
      <Text size="sm" tt="uppercase" style={{ letterSpacing: "0.05em" }}>
        {label}
      </Text>
    </UnstyledButton>
  );
};

export default BackButton;

