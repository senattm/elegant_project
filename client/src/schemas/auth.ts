import { z } from "zod";

export const loginSchema = z.object({
    email: z.email({ message: "Geçerli bir e-posta adresi girin" }),
    password: z.string().min(1, "Şifre zorunludur"),
});

export const registerSchema = z.object({
    name: z.string().min(2, "Ad soyad en az 2 karakter olmalıdır"),
    email: z.email({ message: "Geçerli bir e-posta adresi girin" }),
    password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
});
