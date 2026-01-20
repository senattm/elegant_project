import { Modal, Stack, TextInput, Textarea, Group, Button } from "@mantine/core";
import { IconHome, IconUser, IconPhone, IconMapPin } from "@tabler/icons-react";
import { formatPhone } from "../../utils/formatters";
import FormAlert from "./FormAlert";
import type { Address } from "../../types";

interface AddressForm {
    title: string;
    fullName: string;
    phone: string;
    addressLine: string;
    city: string;
    district: string;
}

interface AddressModalProps {
    opened: boolean;
    onClose: () => void;
    form: AddressForm;
    setForm: (form: AddressForm) => void;
    onSave: () => void;
    loading: boolean;
    error: string;
    editingAddress: Address | null;
}

const AddressModal = ({
    opened,
    onClose,
    form,
    setForm,
    onSave,
    loading,
    error,
    editingAddress,
}: AddressModalProps) => {
    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={editingAddress ? "Adresi Düzenle" : "Yeni Adres Ekle"}
        >
            <Stack gap="md">
                <TextInput
                    label="Adres Başlığı (Opsiyonel)"
                    placeholder="Ev, İş, vb."
                    leftSection={<IconHome size={18} />}
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                />

                <TextInput
                    label="Ad Soyad"
                    placeholder="Ahmet Yılmaz"
                    leftSection={<IconUser size={18} />}
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    required
                />

                <TextInput
                    label="Telefon"
                    placeholder="05XX XXX XX XX"
                    leftSection={<IconPhone size={18} />}
                    value={form.phone}
                    onChange={(e) =>
                        setForm({ ...form, phone: formatPhone(e.target.value) })
                    }
                    required
                />

                <Textarea
                    label="Adres"
                    placeholder="Mahalle, Sokak, No, vb."
                    leftSection={<IconMapPin size={18} />}
                    value={form.addressLine}
                    onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
                    minRows={3}
                    required
                />

                <Group grow>
                    <TextInput
                        label="Şehir"
                        placeholder="İstanbul"
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        required
                    />

                    <TextInput
                        label="İlçe"
                        placeholder="Kadıköy"
                        value={form.district}
                        onChange={(e) => setForm({ ...form, district: e.target.value })}
                        required
                    />
                </Group>

                <FormAlert type="error" message={error} />

                <Group justify="flex-end" mt="md">
                    <Button variant="outline" onClick={onClose}>
                        İptal
                    </Button>
                    <Button onClick={onSave} loading={loading}>
                        {editingAddress ? "Güncelle" : "Ekle"}
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
};

export default AddressModal;
