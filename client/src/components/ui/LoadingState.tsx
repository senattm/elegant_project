import { Center, Stack, Loader, Text } from "@mantine/core";

interface LoadingStateProps {
  message?: string;
  mih?: string | number;
}

const LoadingState = ({
  message = "Yükleniyor...",
  mih = "100vh",
}: LoadingStateProps) => {
  return (
    <Center mih={mih}>
      <Stack align="center" gap="md">
        <Loader color="black" />
        <Text>{message}</Text>
      </Stack>
    </Center>
  );
};

export default LoadingState;

