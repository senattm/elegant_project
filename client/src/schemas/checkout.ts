import { z } from "zod";

const phoneRegex = /^[0-9]{10,11}$/;

export const addressSchema = z.object({
    title: z
        .string()
        .min(2, "Adres başlığı en az 2 karakter olmalıdır"),
    fullName: z
        .string()
        .min(3, "Ad soyad en az 3 karakter olmalıdır"),
    phone: z
        .string()
        .regex(phoneRegex, "Geçerli bir telefon numarası girin (10-11 hane)"),
    addressLine: z
        .string()
        .min(10, "Adres en az 10 karakter olmalıdır"),
    city: z
        .string()
        .min(2, "Şehir seçimi zorunludur"),
    district: z
        .string()
        .min(2, "İlçe seçimi zorunludur"),
});

export const paymentSchema = z.object({
    cardNumber: z
        .string()
        .regex(/^[0-9]{16}$/, "Kart numarası 16 haneli olmalıdır"),
    cardHolderName: z
        .string()
        .min(2, "Kart sahibi adı en az 2 karakter olmalıdır"),
    expiryDate: z
        .string()
        .regex(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, "Geçerli bir tarih girin (AA/YY)"),
    cvv: z
        .string()
        .regex(/^[0-9]{3,4}$/, "CVV 3 veya 4 haneli olmalıdır"),
});

export type AddressFormValues = z.infer<typeof addressSchema>;
export type PaymentFormValues = z.infer<typeof paymentSchema>;
