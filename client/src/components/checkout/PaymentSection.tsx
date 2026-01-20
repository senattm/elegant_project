import { Paper, Text, Stack, Select, Button, Checkbox, Group } from "@mantine/core";
import { IconCreditCard, IconCalendar, IconLock, IconUser } from "@tabler/icons-react";
import FormInput from "../ui/FormInput";

interface PaymentMethod {
    id: number;
    card_holder: string;
    card_last4: string;
    expiry_date: string;
    provider: string;
}

interface PaymentSectionProps {
    savedPaymentMethods: PaymentMethod[];
    selectedPaymentMethodId: string | null;
    onSelectPaymentMethod: (id: string | null, method?: PaymentMethod) => void;
    useNewPaymentMethod: boolean;
    onToggleNewPaymentMethod: () => void;
    paymentData: {
        cardNumber: string;
        cardHolderName: string;
        expiryDate: string;
        cvv: string;
    };
    onPaymentChange: (field: string, value: string) => void;
    savePaymentMethod: boolean;
    onToggleSavePaymentMethod: () => void;
    errors: any;
    formatCardNumber: (value: string) => string;
    formatExpiryDate: (value: string) => string;
    formatCVV: (value: string) => string;
}

const PaymentSection = ({
    savedPaymentMethods,
    selectedPaymentMethodId,
    onSelectPaymentMethod,
    useNewPaymentMethod,
    onToggleNewPaymentMethod,
    paymentData,
    onPaymentChange,
    savePaymentMethod,
    onToggleSavePaymentMethod,
    errors,
    formatCardNumber,
    formatExpiryDate,
    formatCVV,
}: PaymentSectionProps) => {
    return (
        <Paper shadow="none" p="xl" withBorder>
            <Text fz={20} fw={500} mb="md">
                Kart Bilgileri
            </Text>
            <Stack gap="md">
                {savedPaymentMethods.length > 0 && !useNewPaymentMethod ? (
                    <>
                        <Select
                            label="Kayıtlı Kartlarım"
                            placeholder="Kart seçin"
                            data={savedPaymentMethods.map((method) => ({
                                value: method.id.toString(),
                                label: `**** **** **** ${method.card_last4} - ${method.card_holder}`,
                            }))}
                            value={selectedPaymentMethodId}
                            onChange={(value) => {
                                const selectedMethod = savedPaymentMethods.find(
                                    (m) => m.id.toString() === value
                                );
                                onSelectPaymentMethod(value, selectedMethod);
                            }}
                        />
                        <FormInput
                            label="CVV"
                            placeholder="123"
                            type="password"
                            icon={<IconLock size={18} />}
                            value={paymentData.cvv}
                            onChange={(value) => onPaymentChange("cvv", value)}
                            formatter={formatCVV}
                            error={errors.cvv}
                            required
                        />
                        <Button variant="subtle" onClick={onToggleNewPaymentMethod}>
                            Yeni Kart Ekle
                        </Button>
                    </>
                ) : (
                    <>
                        {savedPaymentMethods.length > 0 && (
                            <Button variant="subtle" onClick={onToggleNewPaymentMethod}>
                                Kayıtlı Kartlarımı Kullan
                            </Button>
                        )}
                        <FormInput
                            label="Kart Numarası"
                            placeholder="1234 5678 9012 3456"
                            icon={<IconCreditCard size={18} />}
                            value={paymentData.cardNumber}
                            onChange={(value) => onPaymentChange("cardNumber", value)}
                            formatter={formatCardNumber}
                            error={errors.cardNumber}
                            required
                        />
                        <FormInput
                            label="Kart Sahibi"
                            placeholder="AD SOYAD"
                            icon={<IconUser size={18} />}
                            value={paymentData.cardHolderName}
                            onChange={(value) => onPaymentChange("cardHolderName", value)}
                            error={errors.cardHolderName}
                            required
                        />
                        <Group grow>
                            <FormInput
                                label="Son Kullanma Tarihi"
                                placeholder="MM/YY"
                                icon={<IconCalendar size={18} />}
                                value={paymentData.expiryDate}
                                onChange={(value) => onPaymentChange("expiryDate", value)}
                                formatter={formatExpiryDate}
                                error={errors.expiryDate}
                                required
                            />
                            <FormInput
                                label="CVV"
                                placeholder="123"
                                type="password"
                                icon={<IconLock size={18} />}
                                value={paymentData.cvv}
                                onChange={(value) => onPaymentChange("cvv", value)}
                                formatter={formatCVV}
                                error={errors.cvv}
                                required
                            />
                        </Group>
                        <Checkbox
                            label="Bu kartı kaydet"
                            checked={savePaymentMethod}
                            onChange={() => onToggleSavePaymentMethod()}
                        />
                    </>
                )}
            </Stack>
        </Paper>
    );
};

export default PaymentSection;
