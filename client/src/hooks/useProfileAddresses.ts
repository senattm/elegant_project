import { useCallback, useEffect, useState } from "react";
import { addressSchema } from "../schemas/checkout";
import { addressesApi } from "../api/client";
import { getApiErrorMessage } from "../utils/apiError";
import { useNotification } from "../store/hooks/useNotification";
import type { Address, AddressFormInput } from "../types";

const fetchAddresses = async () => {
  const response = await addressesApi.getAll();
  return response.data as Address[];
};

const emptyAddressForm = (): AddressFormInput => ({
  title: "",
  fullName: "",
  phone: "",
  addressLine: "",
  city: "",
  district: "",
});

const toApiPayload = (form: AddressFormInput) => ({
  title: form.title.trim() || undefined,
  fullName: form.fullName.trim(),
  phone: form.phone.replace(/\D/g, ""),
  addressLine: form.addressLine.trim(),
  city: form.city.trim(),
  district: form.district.trim(),
});

export const useProfileAddresses = (enabled: boolean) => {
  const { addNotification } = useNotification();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [modalOpened, setModalOpened] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [form, setForm] = useState<AddressFormInput>(emptyAddressForm());
  const [formError, setFormError] = useState("");
  const [loadError, setLoadError] = useState("");

  const reloadAddresses = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setLoadError("");
    try {
      setAddresses(await fetchAddresses());
    } catch (error) {
      setLoadError(getApiErrorMessage(error, "Adresler yüklenemedi"));
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setAddresses([]);
      setLoading(false);
      setLoadError("");
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setLoadError("");
      try {
        const data = await fetchAddresses();
        if (!cancelled) {
          setAddresses(data);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(getApiErrorMessage(error, "Adresler yüklenemedi"));
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
    setEditingAddress(null);
    setForm(emptyAddressForm());
    setFormError("");
    setModalOpened(true);
  };

  const openEditModal = (address: Address) => {
    setEditingAddress(address);
    setForm({
      title: address.title || "",
      fullName: address.full_name,
      phone: address.phone,
      addressLine: address.address_line,
      city: address.city,
      district: address.district,
    });
    setFormError("");
    setModalOpened(true);
  };

  const closeModal = () => {
    setModalOpened(false);
    setEditingAddress(null);
    setFormError("");
  };

  const saveAddress = async () => {
    const result = addressSchema.safeParse(form);
    if (!result.success) {
      setFormError(result.error.issues[0].message);
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const payload = toApiPayload(form);

      if (editingAddress) {
        await addressesApi.update(editingAddress.id, payload);
        addNotification("Adres güncellendi", "success");
      } else {
        await addressesApi.create(payload);
        addNotification("Adres eklendi", "success");
      }

      closeModal();
      await reloadAddresses();
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Adres kaydedilemedi"));
    } finally {
      setSaving(false);
    }
  };

  const deleteAddress = async (id: number) => {
    setDeletingId(id);
    try {
      await addressesApi.delete(id);
      setAddresses((prev) => prev.filter((address) => address.id !== id));
      addNotification("Adres silindi", "success");
    } catch (error) {
      addNotification(getApiErrorMessage(error, "Adres silinemedi"), "error");
    } finally {
      setDeletingId(null);
    }
  };

  return {
    addresses,
    loading,
    saving,
    deletingId,
    modalOpened,
    editingAddress,
    form,
    setForm,
    formError,
    loadError,
    openCreateModal,
    openEditModal,
    closeModal,
    saveAddress,
    deleteAddress,
    reload: reloadAddresses,
  };
};
