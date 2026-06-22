import { useCallback, useEffect, useState } from "react";
import { savedPaymentMethodSchema } from "../schemas/checkout";
import { paymentMethodsApi } from "../api/client";
import { getApiErrorMessage } from "../utils/apiError";
import { useNotification } from "../store/hooks/useNotification";
import type { PaymentMethod, PaymentMethodFormInput } from "../types";

const fetchPaymentMethods = async () => {
  const response = await paymentMethodsApi.getAll();
  return response.data as PaymentMethod[];
};

const emptyPaymentForm = (): PaymentMethodFormInput => ({
  cardNumber: "",
  cardHolderName: "",
  expiryDate: "",
});

const toApiPayload = (form: PaymentMethodFormInput) => ({
  cardNumber: form.cardNumber.replace(/\D/g, ""),
  cardHolderName: form.cardHolderName.trim(),
  expiryDate: form.expiryDate,
});

export const useProfilePaymentMethods = (enabled: boolean) => {
  const { addNotification } = useNotification();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [modalOpened, setModalOpened] = useState(false);
  const [form, setForm] = useState<PaymentMethodFormInput>(emptyPaymentForm());
  const [formError, setFormError] = useState("");
  const [loadError, setLoadError] = useState("");

  const reloadPaymentMethods = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setLoadError("");
    try {
      setPaymentMethods(await fetchPaymentMethods());
    } catch (error) {
      setLoadError(getApiErrorMessage(error, "Kartlar yüklenemedi"));
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setPaymentMethods([]);
      setLoading(false);
      setLoadError("");
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setLoadError("");
      try {
        const data = await fetchPaymentMethods();
        if (!cancelled) {
          setPaymentMethods(data);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(getApiErrorMessage(error, "Kartlar yüklenemedi"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const openCreateModal = () => {
    setForm(emptyPaymentForm());
    setFormError("");
    setModalOpened(true);
  };

  const closeModal = () => {
    setModalOpened(false);
    setFormError("");
  };

  const savePaymentMethod = async () => {
    const payload = toApiPayload(form);
    const result = savedPaymentMethodSchema.safeParse(payload);

    if (!result.success) {
      setFormError(result.error.issues[0].message);
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      await paymentMethodsApi.create(result.data);
      addNotification("Kart eklendi", "success");
      closeModal();
      await reloadPaymentMethods();
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Kart eklenemedi"));
    } finally {
      setSaving(false);
    }
  };

  const deletePaymentMethod = async (id: number) => {
    setDeletingId(id);
    try {
      await paymentMethodsApi.delete(id);
      setPaymentMethods((prev) => prev.filter((method) => method.id !== id));
      addNotification("Kart silindi", "success");
    } catch (error) {
      addNotification(getApiErrorMessage(error, "Kart silinemedi"), "error");
    } finally {
      setDeletingId(null);
    }
  };

  return {
    paymentMethods,
    loading,
    saving,
    deletingId,
    modalOpened,
    form,
    setForm,
    formError,
    loadError,
    openCreateModal,
    closeModal,
    savePaymentMethod,
    deletePaymentMethod,
    reload: reloadPaymentMethods,
  };
};
