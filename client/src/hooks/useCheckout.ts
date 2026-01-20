import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import { isAuthenticatedAtom, tokenAtom } from "../store/atoms";
import { useCart, useOrders } from "../store/hooks";
import { addressesApi, paymentMethodsApi } from "../api/client";
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
            const response = await addressesApi.getAll(token);
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
            const response = await paymentMethodsApi.getAll(token);
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
            const response = await fetch("http://localhost:5000/api/orders/my-orders", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const orders = await response.json();
            setIsFirstOrder(orders.length === 0);
        } catch (error) {
            console.error("Sipariş kontrolü yapılamadı:", error);
        }
    };

    const formatCardNumber = (value: string) => value.replace(/\D/g, "").slice(0, 16);
    const formatExpiryDate = (value: string) => {
        const cleaned = value.replace(/\D/g, "");
        return cleaned.length >= 2 ? cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4) : cleaned;
    };
    const formatCVV = (value: string) => value.replace(/\D/g, "").slice(0, 4);
    const formatPhone = (value: string) => value.replace(/\D/g, "").slice(0, 11);

    const validate = (): boolean => {
        const newErrors: any = {};

        if (useNewAddress || !selectedAddressId) {
            if (!addressData.fullName || addressData.fullName.length < 3) {
                newErrors.fullName = "Ad soyad en az 3 karakter olmalıdır";
            }
            if (!addressData.phone || addressData.phone.length < 10) {
                newErrors.phone = "Telefon numarası en az 10 haneli olmalıdır";
            }
            if (!addressData.addressLine || addressData.addressLine.length < 10) {
                newErrors.addressLine = "Adres en az 10 karakter olmalıdır";
            }
            if (!addressData.city || addressData.city.length < 2) {
                newErrors.city = "Şehir gerekli";
            }
            if (!addressData.district || addressData.district.length < 2) {
                newErrors.district = "İlçe gerekli";
            }
        }

        if (useNewPaymentMethod || !selectedPaymentMethodId) {
            if (!paymentData.cardNumber || paymentData.cardNumber.length !== 16) {
                newErrors.cardNumber = "Kart numarası 16 haneli olmalıdır";
            }
            if (!paymentData.cardHolderName || paymentData.cardHolderName.length < 3) {
                newErrors.cardHolderName = "Kart sahibi adı gerekli";
            }
            if (!paymentData.expiryDate || paymentData.expiryDate.length !== 5) {
                newErrors.expiryDate = "Son kullanma tarihi AA/YY formatında olmalıdır";
            }
        }

        if (!paymentData.cvv || paymentData.cvv.length < 3) {
            newErrors.cvv = "CVV en az 3 haneli olmalıdır";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        if (cart.length === 0) return;

        setIsCreatingOrder(true);
        try {
            let addressId = selectedAddressId;
            if (useNewAddress || !selectedAddressId) {
                const addressResponse = await addressesApi.create(addressData, token!);
                addressId = addressResponse.data.id.toString();
            }

            if ((useNewPaymentMethod || !selectedPaymentMethodId) && savePaymentMethod) {
                await paymentMethodsApi.create(
                    {
                        cardNumber: paymentData.cardNumber,
                        cardHolderName: paymentData.cardHolderName,
                        expiryDate: paymentData.expiryDate,
                    },
                    token!
                );
            }

            await createOrder(
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
            navigate("/orders");
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
