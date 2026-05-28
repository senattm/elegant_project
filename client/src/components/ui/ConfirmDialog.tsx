import { Modal, Text, Group, Button } from "@mantine/core";

interface ConfirmDialogProps {
  opened: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog = ({
  opened,
  title,
  message,
  confirmLabel = "Sil",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => (
  <Modal opened={opened} onClose={onCancel} title={title} centered>
    <Text size="sm" mb="lg">
      {message}
    </Text>
    <Group justify="flex-end">
      <Button variant="outline" onClick={onCancel} disabled={loading}>
        İptal
      </Button>
      <Button color="red" onClick={onConfirm} loading={loading}>
        {confirmLabel}
      </Button>
    </Group>
  </Modal>
);

export default ConfirmDialog;
