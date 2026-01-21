import { useState, useEffect } from "react";
import { addressSchema, paymentSchema } from "../schemas/checkout";
import { useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import { isAuthenticatedAtom, tokenAtom } from "../store/atoms";
import { useCart, useOrders } from "../store/hooks";
import { addressesApi, paymentMethodsApi, ordersApi } from "../api/client";
import { formatPhone, formatCardNumber, formatExpiryDate } from "../utils/formatters";
import type { Address } from "../types";

interface PaymentData {
    cardNumber: string;
    cardHolderName: string;
    expiryDate: string;
    cvv: string;
}

interface PaymentMethod {
    id: number;
    card_holder: string;
    card_last4: string;
    expiry_date: string;
    provider: string;
    created_at: string;
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
    const [token] = useAtom(tokenAtom);
    const { cart, getTotalPrice, clearCart, fetchCart } = useCart();
    const { createOrder } = useOrders();
    const [isCreatingOrder, setIsCreatingOrder] = useState(false);

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
    const [savePaymentMethod, setSavePaymentMethod] = useState(false);

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
        if (!token) return;
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
        if (!token) return;
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
        if (!token) return;
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

        if (useNewAddress || !selectedAddressId) {
            const result = addressSchema.safeParse(addressData);
            if (!result.success) {
                isValid = false;
                result.error.issues.forEach((issue) => {
                    newErrors[issue.path[0]] = issue.message;
                });
            }
        }

        if (useNewPaymentMethod || !selectedPaymentMethodId) {
            const result = paymentSchema.safeParse(paymentData);
            if (!result.success) {
                isValid = false;
                result.error.issues.forEach((issue) => {
                    newErrors[issue.path[0]] = issue.message;
                });
            }
        } else {
            const result = paymentSchema.pick({ cvv: true }).safeParse({ cvv: paymentData.cvv });
            if (!result.success) {
                isValid = false;
                result.error.issues.forEach((issue) => {
                    newErrors[issue.path[0]] = issue.message;
                });
            }
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        if (cart.length === 0) return;

        setIsCreatingOrder(true);
        try {
            let addressId = selectedAddressId;
            if (!selectedAddressId) {
                const addressResponse = await addressesApi.create(addressData);
                addressId = addressResponse.data.id.toString();
            }

            if ((useNewPaymentMethod || !selectedPaymentMethodId) && savePaymentMethod) {
                await paymentMethodsApi.create(
                    {
                        cardNumber: paymentData.cardNumber,
                        cardHolderName: paymentData.cardHolderName,
                        expiryDate: paymentData.expiryDate,
                    }
                );
            }

            const orderResponse = await createOrder(
                cart,
                {
                    cardNumber: paymentData.cardNumber,
                    cardHolderName: paymentData.cardHolderName,
                    expiryDate: paymentData.expiryDate,
                    cvv: paymentData.cvv,
                },
                parseInt(addressId!)
            );

            clearCart();
            if (orderResponse?.id) {
                navigate(`/orders/${orderResponse.id}`);
            } else {
                navigate("/orders");
            }
        } catch (error: any) {
            console.error("Sipariş oluşturulamadı:", error);
            setErrors({ submit: error.response?.data?.message || "Sipariş oluşturulamadı" });
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
