import { z } from "zod";

export const updateProfileSchema = z.object({
    name: z.string().min(1, "İsim boş olamaz"),
});

export const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, "Mevcut şifre gereklidir"),
        newPassword: z.string().min(6, "Yeni şifre en az 6 karakter olmalıdır"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Yeni şifreler eşleşmiyor",
        path: ["confirmPassword"],
    });
