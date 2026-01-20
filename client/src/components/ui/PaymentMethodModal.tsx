import { Modal, Stack, TextInput, Group, Button } from "@mantine/core";
import { IconCreditCard, IconUser, IconCalendar } from "@tabler/icons-react";
import { formatCardNumber, formatExpiryDate } from "../../utils/formatters";
import FormAlert from "./FormAlert";

interface PaymentMethodForm {
    cardNumber: string;
    cardHolderName: string;
    expiryDate: string;
}

interface PaymentMethodModalProps {
    opened: boolean;
    onClose: () => void;
    form: PaymentMethodForm;
    setForm: (form: PaymentMethodForm) => void;
    onSave: () => void;
    loading: boolean;
    error: string;
}

const PaymentMethodModal = ({
    opened,
    onClose,
    form,
    setForm,
    onSave,
    loading,
    error,
}: PaymentMethodModalProps) => {
    return (
        <Modal opened={opened} onClose={onClose} title="Yeni Kart Ekle">
            <Stack gap="md">
                <TextInput
                    label="Kart Numarası"
                    placeholder="1234 5678 9012 3456"
                    leftSection={<IconCreditCard size={18} />}
                    value={form.cardNumber}
                    onChange={(e) =>
                        setForm({ ...form, cardNumber: formatCardNumber(e.target.value) })
                    }
                    required
                />

                <TextInput
                    label="Kart Sahibi"
                    placeholder="AHMET YILMAZ"
                    leftSection={<IconUser size={18} />}
                    value={form.cardHolderName}
                    onChange={(e) =>
                        setForm({ ...form, cardHolderName: e.target.value.toUpperCase() })
                    }
                    required
                />

                <TextInput
                    label="Son Kullanma Tarihi"
                    placeholder="MM/YY"
                    leftSection={<IconCalendar size={18} />}
                    value={form.expiryDate}
                    onChange={(e) =>
                        setForm({ ...form, expiryDate: formatExpiryDate(e.target.value) })
                    }
                    required
                />

                <FormAlert type="error" message={error} />

                <Group justify="flex-end" mt="md">
                    <Button variant="outline" onClick={onClose}>
                        İptal
                    </Button>
                    <Button onClick={onSave} loading={loading}>
                        Ekle
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
};

export default PaymentMethodModal;
