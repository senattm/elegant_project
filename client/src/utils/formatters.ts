export const formatPhone = (value: string): string => {
    const cleaned = value.replace(/\D/g, "");
    return cleaned.slice(0, 11);
};

export const formatCardNumber = (value: string): string => {
    const cleaned = value.replace(/\D/g, "");
    return cleaned.slice(0, 16);
};

export const formatExpiryDate = (value: string): string => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 2) {
        return cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4);
    }
    return cleaned;
};
