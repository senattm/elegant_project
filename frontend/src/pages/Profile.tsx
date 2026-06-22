import { useState } from "react";
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
  Loader,
  Center,
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
import { userAtom, isAuthenticatedAtom } from "../store/atoms";
import { authApi } from "../api/client";
import { getApiErrorMessage } from "../utils/apiError";
import { useFormState } from "../hooks/useFormState";
import { useProfileAddresses } from "../hooks/useProfileAddresses";
import { useProfilePaymentMethods } from "../hooks/useProfilePaymentMethods";
import FormAlert from "../components/ui/FormAlert";
import ProfileSection from "../components/ui/ProfileSection";
import AddressModal from "../components/ui/AddressModal";
import PaymentMethodModal from "../components/ui/PaymentMethodModal";
import ConfirmDialog from "../components/ui/ConfirmDialog";

type DeleteTarget =
  | { type: "address"; id: number }
  | { type: "payment"; id: number }
  | null;

const Profile = () => {
  const [user, setUser] = useAtom(userAtom);
  const [isAuthenticated] = useAtom(isAuthenticatedAtom);

  const [name, setName] = useState(user?.name || "");
  const profileState = useFormState();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const passwordState = useFormState();

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  const addressManager = useProfileAddresses(isAuthenticated);
  const paymentManager = useProfilePaymentMethods(isAuthenticated);

  const handleUpdateProfile = async () => {
    const result = updateProfileSchema.safeParse({ name });

    if (!result.success) {
      profileState.setError(result.error.issues[0].message);
      return;
    }

    try {
      profileState.setLoading(true);
      profileState.reset();

      const response = await authApi.updateProfile({ name });
      setUser(response.data.user);
      profileState.setSuccess("Profil başarıyla güncellendi");
    } catch (error: unknown) {
      profileState.setError(getApiErrorMessage(error, "Profil güncellenemedi"));
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

    try {
      passwordState.setLoading(true);
      passwordState.reset();

      await authApi.changePassword({ currentPassword, newPassword });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      passwordState.setSuccess("Şifre başarıyla değiştirildi");
    } catch (error: unknown) {
      passwordState.setError(getApiErrorMessage(error, "Şifre değiştirilemedi"));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === "address") {
      await addressManager.deleteAddress(deleteTarget.id);
    } else {
      await paymentManager.deletePaymentMethod(deleteTarget.id);
    }

    setDeleteTarget(null);
  };

  const isDeleting =
    deleteTarget?.type === "address"
      ? addressManager.deletingId === deleteTarget.id
      : deleteTarget?.type === "payment"
        ? paymentManager.deletingId === deleteTarget.id
        : false;

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
              onClick={addressManager.openCreateModal}
              size="sm"
            >
              Yeni Adres
            </Button>
          </Group>

          <FormAlert type="error" message={addressManager.loadError} />

          {addressManager.loading && addressManager.addresses.length === 0 ? (
            <Center py="xl">
              <Loader size="sm" />
            </Center>
          ) : !addressManager.loadError && addressManager.addresses.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">
              Henüz kayıtlı adres yok
            </Text>
          ) : (
            <Stack gap="md">
              {addressManager.addresses.map((address) => (
                <Paper key={address.id} p="md" withBorder>
                  <Group justify="space-between" mb="xs">
                    <Group gap="xs">
                      <IconHome size={18} />
                      {address.title && <Badge size="sm">{address.title}</Badge>}
                    </Group>
                    <Group gap="xs">
                      <ActionIcon
                        variant="subtle"
                        onClick={() => addressManager.openEditModal(address)}
                        aria-label="Adresi düzenle"
                      >
                        <IconEdit size={18} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        loading={addressManager.deletingId === address.id}
                        onClick={() =>
                          setDeleteTarget({ type: "address", id: address.id })
                        }
                        aria-label="Adresi sil"
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
              onClick={paymentManager.openCreateModal}
              size="sm"
            >
              Yeni Kart
            </Button>
          </Group>

          <FormAlert type="error" message={paymentManager.loadError} />

          {paymentManager.loading && paymentManager.paymentMethods.length === 0 ? (
            <Center py="xl">
              <Loader size="sm" />
            </Center>
          ) : !paymentManager.loadError && paymentManager.paymentMethods.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">
              Henüz kayıtlı kart yok
            </Text>
          ) : (
            <Stack gap="md">
              {paymentManager.paymentMethods.map((pm) => (
                <Paper key={pm.id} p="md" withBorder>
                  <Group justify="space-between">
                    <Group gap="md">
                      <IconCreditCard size={24} />
                      <div>
                        <Text size="sm" fw={500}>
                          {pm.card_holder}
                        </Text>
                        <Text size="sm" c="dimmed">
                          **** **** **** {pm.card_last4}
                        </Text>
                        {pm.expiry_date && (
                          <Text size="xs" c="dimmed">
                            SKT: {pm.expiry_date}
                          </Text>
                        )}
                      </div>
                    </Group>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      loading={paymentManager.deletingId === pm.id}
                      onClick={() =>
                        setDeleteTarget({ type: "payment", id: pm.id })
                      }
                      aria-label="Kartı sil"
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
        opened={addressManager.modalOpened}
        onClose={addressManager.closeModal}
        form={addressManager.form}
        setForm={addressManager.setForm}
        onSave={addressManager.saveAddress}
        loading={addressManager.saving}
        error={addressManager.formError}
        editingAddress={addressManager.editingAddress}
      />

      <PaymentMethodModal
        opened={paymentManager.modalOpened}
        onClose={paymentManager.closeModal}
        form={paymentManager.form}
        setForm={paymentManager.setForm}
        onSave={paymentManager.savePaymentMethod}
        loading={paymentManager.saving}
        error={paymentManager.formError}
      />

      <ConfirmDialog
        opened={deleteTarget !== null}
        title={deleteTarget?.type === "address" ? "Adresi sil" : "Kartı sil"}
        message={
          deleteTarget?.type === "address"
            ? "Bu adresi silmek istediğinize emin misiniz?"
            : "Bu kartı silmek istediğinize emin misiniz?"
        }
        loading={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </Container>
  );
};

export default Profile;
