import { useState, useEffect } from "react";
import { addressSchema, paymentSchema } from "../schemas/checkout";
import { updateProfileSchema, changePasswordSchema } from "../schemas/profile";
import {
  Container,
  TextInput,
  Button,
  Stack,
  PasswordInput,
  Text,
  Group,
  Paper,
  ActionIcon,
  Badge,
} from "@mantine/core";
import {
  IconUser,
  IconMail,
  IconLock,
  IconHome,
  IconPlus,
  IconEdit,
  IconTrash,
  IconCreditCard,
} from "@tabler/icons-react";
import { useAtom } from "jotai";
import { userAtom, tokenAtom } from "../store/atoms";
import { authApi, addressesApi, paymentMethodsApi } from "../api/client";
import type { Address } from "../types";
import { useFormState } from "../hooks/useFormState";
import FormAlert from "../components/ui/FormAlert";
import ProfileSection from "../components/ui/ProfileSection";
import AddressModal from "../components/ui/AddressModal";
import PaymentMethodModal from "../components/ui/PaymentMethodModal";

const Profile = () => {
  const [user, setUser] = useAtom(userAtom);
  const [token] = useAtom(tokenAtom);

  const [name, setName] = useState(user?.name || "");
  const profileState = useFormState();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const passwordState = useFormState();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressModalOpened, setAddressModalOpened] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState({
    title: "",
    fullName: "",
    phone: "",
    addressLine: "",
    city: "",
    district: "",
  });
  const addressState = useFormState();

  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [paymentMethodModalOpened, setPaymentMethodModalOpened] = useState(false);
  const [paymentMethodForm, setPaymentMethodForm] = useState({
    cardNumber: "",
    cardHolderName: "",
    expiryDate: "",
  });
  const paymentMethodState = useFormState();

  useEffect(() => {
    if (token) {
      fetchAddresses();
      fetchPaymentMethods();
    }
  }, [token]);

  const handleUpdateProfile = async () => {
    const result = updateProfileSchema.safeParse({ name });

    if (!result.success) {
      profileState.setError(result.error.issues[0].message);
      return;
    }

    if (!token) {
      profileState.setError("Oturum geçersiz");
      return;
    }

    try {
      profileState.setLoading(true);
      profileState.reset();

      const response = await authApi.updateProfile({ name });
      setUser(response.data.user);
      profileState.setSuccess("Profil başarıyla güncellendi");
    } catch (error: any) {
      profileState.setError(
        error.response?.data?.message || "Profil güncellenemedi"
      );
    }
  };

  const handleChangePassword = async () => {
    const result = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!result.success) {
      passwordState.setError(result.error.issues[0].message);
      return;
    }

    if (!token) {
      passwordState.setError("Oturum geçersiz");
      return;
    }

    try {
      passwordState.setLoading(true);
      passwordState.reset();

      await authApi.changePassword(
        { currentPassword, newPassword }
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      passwordState.setSuccess("Şifre başarıyla değiştirildi");
    } catch (error: any) {
      passwordState.setError(
        error.response?.data?.message || "Şifre değiştirilemedi"
      );
    }
  };

  const fetchAddresses = async () => {
    if (!token) return;

    try {
      const response = await addressesApi.getAll();
      setAddresses(response.data);
    } catch (error) {
      console.error("Adresler yüklenemedi:", error);
    }
  };

  const fetchPaymentMethods = async () => {
    if (!token) return;

    try {
      const response = await paymentMethodsApi.getAll();
      setPaymentMethods(response.data);
    } catch (error) {
      console.error("Ödeme yöntemleri yüklenemedi:", error);
    }
  };

  const openAddressModal = (address?: Address) => {
    if (address) {
      setEditingAddress(address);
      setAddressForm({
        title: address.title || "",
        fullName: address.full_name,
        phone: address.phone,
        addressLine: address.address_line,
        city: address.city,
        district: address.district,
      });
    } else {
      setEditingAddress(null);
      setAddressForm({
        title: "",
        fullName: "",
        phone: "",
        addressLine: "",
        city: "",
        district: "",
      });
    }
    addressState.reset();
    setAddressModalOpened(true);
  };

  const handleSaveAddress = async () => {
    const result = addressSchema.safeParse(addressForm);

    if (!result.success) {
      addressState.setError(result.error.issues[0].message);
      return;
    }

    if (!token) {
      addressState.setError("Oturum geçersiz");
      return;
    }

    try {
      addressState.setLoading(true);

      if (editingAddress) {
        await addressesApi.update(editingAddress.id, addressForm);
      } else {
        await addressesApi.create(addressForm);
      }

      await fetchAddresses();
      setAddressModalOpened(false);
      addressState.setSuccess(
        editingAddress ? "Adres güncellendi" : "Adres eklendi"
      );
    } catch (error: any) {
      addressState.setError(
        error.response?.data?.message || "Adres kaydedilemedi"
      );
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!token || !confirm("Bu adresi silmek istediğinize emin misiniz?")) return;

    try {
      await addressesApi.delete(id);
      await fetchAddresses();
      addressState.setSuccess("Adres silindi");
    } catch (error: any) {
      addressState.setError(error.response?.data?.message || "Adres silinemedi");
    }
  };

  const openPaymentMethodModal = () => {
    setPaymentMethodForm({
      cardNumber: "",
      cardHolderName: "",
      expiryDate: "",
    });
    paymentMethodState.reset();
    setPaymentMethodModalOpened(true);
  };

  const handleSavePaymentMethod = async () => {
    const result = paymentSchema.omit({ cvv: true }).safeParse(paymentMethodForm);

    if (!result.success) {
      paymentMethodState.setError(result.error.issues[0].message);
      return;
    }

    if (!token) {
      paymentMethodState.setError("Oturum geçersiz");
      return;
    }

    try {
      paymentMethodState.setLoading(true);

      await paymentMethodsApi.create(paymentMethodForm);
      await fetchPaymentMethods();
      setPaymentMethodModalOpened(false);
      paymentMethodState.setSuccess("Kart eklendi");
    } catch (error: any) {
      paymentMethodState.setError(
        error.response?.data?.message || "Kart eklenemedi"
      );
    }
  };

  const handleDeletePaymentMethod = async (id: number) => {
    if (!token || !confirm("Bu kartı silmek istediğinize emin misiniz?")) return;

    try {
      await paymentMethodsApi.delete(id);
      await fetchPaymentMethods();
      paymentMethodState.setSuccess("Kart silindi");
    } catch (error: any) {
      paymentMethodState.setError(error.response?.data?.message || "Kart silinemedi");
    }
  };

  return (
    <Container size="sm" pt={{ base: 230, sm: 180, md: 140 }} pb={60}>
      <Stack gap="xl">
        <Paper shadow="none" p="xl" withBorder>
          <Group justify="space-between" mb="md">
            <Text fz={20} fw={500}>
              Adreslerim
            </Text>
            <Button
              leftSection={<IconPlus size={18} />}
              onClick={() => openAddressModal()}
              size="sm"
            >
              Yeni Adres
            </Button>
          </Group>

          <FormAlert type="success" message={addressState.success} />
          <FormAlert type="error" message={addressState.error} />

          {addresses.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">
              Henüz kayıtlı adres yok
            </Text>
          ) : (
            <Stack gap="md">
              {addresses.map((address) => (
                <Paper key={address.id} p="md" withBorder>
                  <Group justify="space-between" mb="xs">
                    <Group gap="xs">
                      <IconHome size={18} />
                      {address.title && <Badge size="sm">{address.title}</Badge>}
                    </Group>
                    <Group gap="xs">
                      <ActionIcon
                        variant="subtle"
                        onClick={() => openAddressModal(address)}
                      >
                        <IconEdit size={18} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => handleDeleteAddress(address.id)}
                      >
                        <IconTrash size={18} />
                      </ActionIcon>
                    </Group>
                  </Group>
                  <Text size="sm" fw={500}>
                    {address.full_name}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {address.phone}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {address.address_line}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {address.district} / {address.city}
                  </Text>
                </Paper>
              ))}
            </Stack>
          )}
        </Paper>

        <Paper shadow="none" p="xl" withBorder>
          <Group justify="space-between" mb="md">
            <Text fz={20} fw={500}>
              Kayıtlı Kartlarım
            </Text>
            <Button
              leftSection={<IconPlus size={18} />}
              onClick={openPaymentMethodModal}
              size="sm"
            >
              Yeni Kart
            </Button>
          </Group>

          <FormAlert type="success" message={paymentMethodState.success} />
          <FormAlert type="error" message={paymentMethodState.error} />

          {paymentMethods.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">
              Henüz kayıtlı kart yok
            </Text>
          ) : (
            <Stack gap="md">
              {paymentMethods.map((pm) => (
                <Paper key={pm.id} p="md" withBorder>
                  <Group justify="space-between">
                    <Group gap="md">
                      <IconCreditCard size={24} />
                      <div>
                        <Text size="sm" fw={500}>
                          {pm.card_holder_name}
                        </Text>
                        <Text size="sm" c="dimmed">
                          **** **** **** {pm.last_four_digits}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {pm.expiry_date}
                        </Text>
                      </div>
                    </Group>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => handleDeletePaymentMethod(pm.id)}
                    >
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Group>
                </Paper>
              ))}
            </Stack>
          )}
        </Paper>

        <ProfileSection title="Profil Bilgileri">
          <TextInput
            label="Ad Soyad"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Adınız ve soyadınız"
            leftSection={<IconUser size={18} />}
          />

          <TextInput
            label="E-posta"
            value={user?.email || ""}
            disabled
            leftSection={<IconMail size={18} />}
          />

          <FormAlert type="success" message={profileState.success} />
          <FormAlert type="error" message={profileState.error} />

          <Group justify="flex-end" mt="md">
            <Button onClick={handleUpdateProfile} loading={profileState.loading}>
              Profili Güncelle
            </Button>
          </Group>
        </ProfileSection>

        <ProfileSection title="Şifre Değiştir">
          <PasswordInput
            label="Mevcut Şifre"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Mevcut şifreniz"
            leftSection={<IconLock size={18} />}
          />

          <PasswordInput
            label="Yeni Şifre"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Yeni şifreniz (en az 6 karakter)"
            leftSection={<IconLock size={18} />}
          />

          <PasswordInput
            label="Yeni Şifre (Tekrar)"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Yeni şifrenizi tekrar girin"
            leftSection={<IconLock size={18} />}
          />

          <FormAlert type="success" message={passwordState.success} />
          <FormAlert type="error" message={passwordState.error} />

          <Group justify="flex-end" mt="md">
            <Button onClick={handleChangePassword} loading={passwordState.loading}>
              Şifreyi Değiştir
            </Button>
          </Group>
        </ProfileSection>
      </Stack>

      <AddressModal
        opened={addressModalOpened}
        onClose={() => setAddressModalOpened(false)}
        form={addressForm}
        setForm={setAddressForm}
        onSave={handleSaveAddress}
        loading={addressState.loading}
        error={addressState.error}
        editingAddress={editingAddress}
      />

      <PaymentMethodModal
        opened={paymentMethodModalOpened}
        onClose={() => setPaymentMethodModalOpened(false)}
        form={paymentMethodForm}
        setForm={setPaymentMethodForm}
        onSave={handleSavePaymentMethod}
        loading={paymentMethodState.loading}
        error={paymentMethodState.error}
      />
    </Container>
  );
};

export default Profile;
