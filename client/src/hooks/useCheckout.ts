import { useState, useEffect } from "react";
import { addressSchema, paymentSchema } from "../schemas/checkout";
import { useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import { isAuthenticatedAtom } from "../store/atoms";
import { useCart, useOrders, useNotification } from "../store/hooks";
import { addressesApi, paymentMethodsApi, ordersApi } from "../api/client";
import type { PaymentMethod } from "../types";
import { formatPhone, formatCardNumber, formatExpiryDate } from "../utils/formatters";
import type { Address } from "../types";

interface PaymentData {
    cardNumber: string;
    cardHolderName: string;
    expiryDate: string;
    cvv: string;
}

interface AddressData {
    title: string;
    fullName: string;
    phone: string;
    addressLine: string;
    city: string;
    district: string;
}

export const useCheckout = () => {
    const navigate = useNavigate();
    const [isAuthenticated] = useAtom(isAuthenticatedAtom);
    const { cart, getTotalPrice, clearCart, fetchCart } = useCart();
    const { createOrder } = useOrders();
    const { addNotification } = useNotification();
    const [isCreatingOrder, setIsCreatingOrder] = useState(false);
    const [savePaymentMethod, setSavePaymentMethod] = useState(false);

    const [paymentData, setPaymentData] = useState<PaymentData>({
        cardNumber: "",
        cardHolderName: "",
        expiryDate: "",
        cvv: "",
    });

    const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [useNewAddress, setUseNewAddress] = useState(false);

    const [savedPaymentMethods, setSavedPaymentMethods] = useState<PaymentMethod[]>([]);
    const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null);
    const [useNewPaymentMethod, setUseNewPaymentMethod] = useState(false);
    const [addressData, setAddressData] = useState<AddressData>({
        title: "",
        fullName: "",
        phone: "",
        addressLine: "",
        city: "",
        district: "",
    });

    const [errors, setErrors] = useState<any>({});
    const [couponCode, setCouponCode] = useState("");
    const [isFirstOrder, setIsFirstOrder] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/auth");
            return;
        }
        fetchCart();
        loadSavedAddresses();
        loadSavedPaymentMethods();
        checkFirstOrder();
    }, [isAuthenticated]);

    const loadSavedAddresses = async () => {
        if (!isAuthenticated) return;
        try {
            const response = await addressesApi.getAll();
            setSavedAddresses(response.data);
            if (response.data.length > 0) {
                setSelectedAddressId(response.data[0].id.toString());
            }
        } catch (error) {
            console.error("Adresler yüklenemedi:", error);
        }
    };

    const loadSavedPaymentMethods = async () => {
        if (!isAuthenticated) return;
        try {
            const response = await paymentMethodsApi.getAll();
            setSavedPaymentMethods(response.data);
            if (response.data.length > 0) {
                setSelectedPaymentMethodId(response.data[0].id.toString());
                const firstMethod = response.data[0];
                setPaymentData({
                    cardNumber: `000000000000${firstMethod.card_last4}`,
                    cardHolderName: firstMethod.card_holder,
                    expiryDate: firstMethod.expiry_date || "",
                    cvv: "",
                });
            }
        } catch (error) {
            console.error("Kartlar yüklenemedi:", error);
        }
    };

    const checkFirstOrder = async () => {
        if (!isAuthenticated) return;
        try {
            const response = await ordersApi.checkFirstOrder();
            setIsFirstOrder(response.data.isFirstOrder);
        } catch (error) {
            console.error("Sipariş kontrolü yapılamadı:", error);
        }
    };

    const formatCVV = (value: string) => value.replace(/\D/g, "").slice(0, 4);

    const validate = (): boolean => {
        let isValid = true;
        const newErrors: any = {};

        const needsNewAddress =
            savedAddresses.length === 0 || useNewAddress;

        if (needsNewAddress) {
            const result = addressSchema.safeParse(addressData);
            if (!result.success) {
                isValid = false;
                result.error.issues.forEach((issue) => {
                    newErrors[issue.path[0]] = issue.message;
                });
            }
        } else if (!selectedAddressId) {
            isValid = false;
            newErrors.address = "Lütfen bir teslimat adresi seçin";
        }

        const needsNewPayment =
            savedPaymentMethods.length === 0 || useNewPaymentMethod;

        if (needsNewPayment) {
            const result = paymentSchema.safeParse(paymentData);
            if (!result.success) {
                isValid = false;
                result.error.issues.forEach((issue) => {
                    newErrors[issue.path[0]] = issue.message;
                });
            }
        } else if (!selectedPaymentMethodId) {
            isValid = false;
            newErrors.payment = "Lütfen bir kart seçin";
        } else {
            const cvvResult = paymentSchema.pick({ cvv: true }).safeParse({ cvv: paymentData.cvv });
            if (!cvvResult.success) {
                isValid = false;
                cvvResult.error.issues.forEach((issue) => {
                    newErrors[issue.path[0]] = issue.message;
                });
            }

            const expiryResult = paymentSchema
                .pick({ expiryDate: true })
                .safeParse({ expiryDate: paymentData.expiryDate });
            if (!expiryResult.success) {
                isValid = false;
                newErrors.expiryDate =
                    "Kayıtlı kartın son kullanma tarihi geçersiz. Lütfen yeni kart ekleyin.";
            }
        }

        setErrors(newErrors);
        return isValid;
    };

    const buildPaymentPayload = () => ({
        cardNumber: paymentData.cardNumber.replace(/\D/g, ""),
        cardHolderName: paymentData.cardHolderName.trim(),
        expiryDate: paymentData.expiryDate,
        cvv: paymentData.cvv,
    });

    const handleSubmit = async () => {
        if (!validate()) return;
        if (cart.length === 0) return;

        setIsCreatingOrder(true);
        setErrors({});
        try {
            let resolvedAddressId: number;

            const needsNewAddress =
                savedAddresses.length === 0 || useNewAddress;

            if (needsNewAddress) {
                const addressResponse = await addressesApi.create({
                    title: addressData.title.trim() || undefined,
                    fullName: addressData.fullName.trim(),
                    phone: addressData.phone.replace(/\D/g, ""),
                    addressLine: addressData.addressLine.trim(),
                    city: addressData.city.trim(),
                    district: addressData.district.trim(),
                });
                const createdId = addressResponse.data?.address?.id;
                if (!createdId) {
                    throw new Error("Adres oluşturulamadı");
                }
                resolvedAddressId = createdId;
                await loadSavedAddresses();
            } else {
                resolvedAddressId = parseInt(selectedAddressId!, 10);
            }

            if (Number.isNaN(resolvedAddressId)) {
                setErrors({ submit: "Geçerli bir teslimat adresi seçin" });
                return;
            }

            const paymentPayload = buildPaymentPayload();
            const needsNewPayment =
                savedPaymentMethods.length === 0 || useNewPaymentMethod;

            const orderResponse = await createOrder(
                cart,
                paymentPayload,
                resolvedAddressId
            );

            if (needsNewPayment && savePaymentMethod) {
                try {
                    await paymentMethodsApi.create({
                        cardNumber: paymentPayload.cardNumber,
                        cardHolderName: paymentPayload.cardHolderName,
                        expiryDate: paymentPayload.expiryDate,
                    });
                    addNotification("Kartınız kaydedildi", "success");
                    await loadSavedPaymentMethods();
                } catch (error) {
                    addNotification(
                        "Sipariş alındı ancak kart kaydedilemedi",
                        "info"
                    );
                }
            }

            await clearCart();
            if (orderResponse?.id) {
                navigate(`/orders/${orderResponse.id}`);
            } else {
                navigate("/orders");
            }
        } catch (error: any) {
            console.error("Sipariş oluşturulamadı:", error);
            const apiMessage = error.response?.data?.message;
            const submitMessage = Array.isArray(apiMessage)
                ? apiMessage[0]
                : apiMessage || error.message || "Sipariş oluşturulamadı";
            setErrors({ submit: submitMessage });
        } finally {
            setIsCreatingOrder(false);
            setPaymentData(prev => ({ ...prev, cvv: "" }));
        }
    };

    const total = getTotalPrice();
    const discount = isFirstOrder ? total * 0.1 : 0;
    const shippingCost = total >= 7500 ? 0 : 79;
    const finalTotal = total - discount + shippingCost;

    return {
        cart,
        paymentData,
        setPaymentData,
        addressData,
        setAddressData,
        savedAddresses,
        selectedAddressId,
        setSelectedAddressId,
        useNewAddress,
        setUseNewAddress,
        savedPaymentMethods,
        selectedPaymentMethodId,
        setSelectedPaymentMethodId,
        useNewPaymentMethod,
        setUseNewPaymentMethod,
        savePaymentMethod,
        setSavePaymentMethod,
        errors,
        isCreatingOrder,
        couponCode,
        setCouponCode,
        isFirstOrder,
        total,
        discount,
        shippingCost,
        finalTotal,
        formatCardNumber,
        formatExpiryDate,
        formatCVV,
        formatPhone,
        handleSubmit,
        navigate,
    };
};
