import { Paper, Text, Stack, Select, Button, Group, Anchor } from "@mantine/core";
import { Link } from "react-router-dom";
import { IconMapPin, IconUser, IconPhone, IconHome } from "@tabler/icons-react";
import FormInput from "../ui/FormInput";
import type { Address } from "../../types";

interface AddressSectionProps {
    savedAddresses: Address[];
    selectedAddressId: string | null;
    onSelectAddress: (id: string | null) => void;
    useNewAddress: boolean;
    onToggleNewAddress: () => void;
    addressData: {
        title: string;
        fullName: string;
        phone: string;
        addressLine: string;
        city: string;
        district: string;
    };
    onAddressChange: (field: string, value: string) => void;
    errors: any;
    formatPhone: (value: string) => string;
}

const AddressSection = ({
    savedAddresses,
    selectedAddressId,
    onSelectAddress,
    useNewAddress,
    onToggleNewAddress,
    addressData,
    onAddressChange,
    errors,
    formatPhone,
}: AddressSectionProps) => {
    return (
        <Paper shadow="none" p="xl" withBorder>
            <Group justify="space-between" mb="md">
                <Text fz={20} fw={500}>
                    Teslimat Adresi
                </Text>
                <Anchor component={Link} to="/profile" size="sm">
                    Adreslerimi yönet
                </Anchor>
            </Group>
            <Stack gap="md">
                {savedAddresses.length > 0 && !useNewAddress ? (
                    <>
                        <Select
                            label="Kayıtlı Adreslerim"
                            placeholder="Adres seçin"
                            data={savedAddresses.map((addr) => ({
                                value: addr.id.toString(),
                                label: `${addr.title} - ${addr.full_name}`,
                            }))}
                            value={selectedAddressId}
                            onChange={onSelectAddress}
                        />
                        <Button variant="subtle" onClick={onToggleNewAddress}>
                            Yeni Adres Ekle
                        </Button>
                    </>
                ) : (
                    <>
                        {savedAddresses.length > 0 && (
                            <Button variant="subtle" onClick={onToggleNewAddress}>
                                Kayıtlı Adreslerimi Kullan
                            </Button>
                        )}
                        <FormInput
                            label="Adres Başlığı"
                            placeholder="Ev, İş, vb."
                            icon={<IconHome size={18} />}
                            value={addressData.title}
                            onChange={(value) => onAddressChange("title", value)}
                            error={errors.title}
                            required
                        />
                        <FormInput
                            label="Ad Soyad"
                            placeholder="Ad Soyad"
                            icon={<IconUser size={18} />}
                            value={addressData.fullName}
                            onChange={(value) => onAddressChange("fullName", value)}
                            error={errors.fullName}
                            required
                        />
                        <FormInput
                            label="Telefon"
                            placeholder="5XX XXX XX XX"
                            icon={<IconPhone size={18} />}
                            value={addressData.phone}
                            onChange={(value) => onAddressChange("phone", value)}
                            formatter={formatPhone}
                            error={errors.phone}
                            required
                        />
                        <FormInput
                            label="Adres"
                            placeholder="Mahalle, Sokak, No, vb."
                            icon={<IconMapPin size={18} />}
                            value={addressData.addressLine}
                            onChange={(value) => onAddressChange("addressLine", value)}
                            error={errors.addressLine}
                            required
                        />
                        <Group grow>
                            <FormInput
                                label="Şehir"
                                placeholder="İstanbul"
                                value={addressData.city}
                                onChange={(value) => onAddressChange("city", value)}
                                error={errors.city}
                                required
                            />
                            <FormInput
                                label="İlçe"
                                placeholder="Kadıköy"
                                value={addressData.district}
                                onChange={(value) => onAddressChange("district", value)}
                                error={errors.district}
                                required
                            />
                        </Group>
                    </>
                )}
            </Stack>
        </Paper>
    );
};

export default AddressSection;
