import { useState, useEffect } from "react";
import {
  Container,
  Paper,
  TextInput,
  Button,
  Stack,
  PasswordInput,
  Text,
  Group,
  Alert,
  Modal,
  Textarea,
  ActionIcon,
  Badge,
} from "@mantine/core";
import {
  IconCheck,
  IconAlertCircle,
  IconUser,
  IconMail,
  IconLock,
  IconMapPin,
  IconHome,
  IconPhone,
  IconPlus,
  IconEdit,
  IconTrash,
  IconCreditCard,
  IconCalendar,
} from "@tabler/icons-react";
import { useAtom } from "jotai";
import { userAtom, tokenAtom } from "../store/atoms";
import { authApi, addressesApi, paymentMethodsApi } from "../api/client";
import type { Address } from "../types";

const Profile = () => {
  const [user, setUser] = useAtom(userAtom);
  const [token] = useAtom(tokenAtom);

  const [name, setName] = useState(user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

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
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressSuccess, setAddressSuccess] = useState("");
  const [addressError, setAddressError] = useState("");

  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [paymentMethodModalOpened, setPaymentMethodModalOpened] =
    useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<any | null>(
    null
  );
  const [paymentMethodForm, setPaymentMethodForm] = useState({
    cardNumber: "",
    cardHolderName: "",
    expiryDate: "",
  });
  const [paymentMethodLoading, setPaymentMethodLoading] = useState(false);
  const [paymentMethodSuccess, setPaymentMethodSuccess] = useState("");
  const [paymentMethodError, setPaymentMethodError] = useState("");

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      setProfileError("İsim boş olamaz");
      return;
    }

    if (!token) {
      setProfileError("Oturum geçersiz");
      return;
    }

    try {
      setProfileLoading(true);
      setProfileError("");
      setProfileSuccess("");

      const response = await authApi.updateProfile(
        { name: name.trim() },
        token
      );

      if (response.data.user) {
        setUser(response.data.user);
        setProfileSuccess("Profil başarıyla güncellendi");
      }
    } catch (error: any) {
      setProfileError(error.response?.data?.message || "Profil güncellenemedi");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      setPasswordError("Tüm alanları doldurun");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Yeni şifre en az 6 karakter olmalı");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Yeni şifreler eşleşmiyor");
      return;
    }

    if (!token) {
      setPasswordError("Oturum geçersiz");
      return;
    }

    try {
      setPasswordLoading(true);
      setPasswordError("");
      setPasswordSuccess("");

      await authApi.changePassword({ currentPassword, newPassword }, token);

      setPasswordSuccess("Şifre başarıyla değiştirildi");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      setPasswordError(
        error.response?.data?.message || "Şifre değiştirilemedi"
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const fetchAddresses = async () => {
    if (!token) return;
    try {
      const response = await addressesApi.getAll(token);
      setAddresses(response.data);
    } catch (error) {
      console.error("Adresler yüklenemedi:", error);
    }
  };

  useEffect(() => {
    fetchAddresses();
    fetchPaymentMethods();
  }, [token]);

  const fetchPaymentMethods = async () => {
    if (!token) return;
    try {
      const response = await paymentMethodsApi.getAll(token);
      setPaymentMethods(response.data);
    } catch (error) {
      console.error("Kartlar yüklenemedi:", error);
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
    setAddressSuccess("");
    setAddressError("");
    setAddressModalOpened(true);
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    return cleaned.slice(0, 11);
  };

  const handleSaveAddress = async () => {
    if (
      !addressForm.fullName ||
      !addressForm.phone ||
      !addressForm.addressLine ||
      !addressForm.city ||
      !addressForm.district
    ) {
      setAddressError("Tüm zorunlu alanları doldurun");
      return;
    }

    if (addressForm.fullName.length < 3) {
      setAddressError("Ad soyad en az 3 karakter olmalı");
      return;
    }

    if (addressForm.phone.length < 10) {
      setAddressError("Telefon en az 10 haneli olmalı");
      return;
    }

    if (!/^[0-9]+$/.test(addressForm.phone)) {
      setAddressError("Telefon sadece rakamlardan oluşmalı");
      return;
    }

    if (addressForm.addressLine.length < 10) {
      setAddressError("Adres en az 10 karakter olmalı");
      return;
    }

    if (addressForm.city.length < 2) {
      setAddressError("Şehir en az 2 karakter olmalı");
      return;
    }

    if (addressForm.district.length < 2) {
      setAddressError("İlçe en az 2 karakter olmalı");
      return;
    }

    if (!token) return;

    try {
      setAddressLoading(true);
      setAddressError("");

      if (editingAddress) {
        await addressesApi.update(editingAddress.id, addressForm, token);
        setAddressSuccess("Adres güncellendi");
      } else {
        await addressesApi.create(addressForm, token);
        setAddressSuccess("Adres eklendi");
      }

      await fetchAddresses();
      setAddressModalOpened(false);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        (Array.isArray(error.response?.data?.message)
          ? error.response?.data?.message[0]
          : "İşlem başarısız oldu");
      setAddressError(errorMessage);
    } finally {
      setAddressLoading(false);
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!token) return;
    if (!confirm("Bu adresi silmek istediğinizden emin misiniz?")) return;

    try {
      await addressesApi.delete(id, token);
      await fetchAddresses();
      setAddressSuccess("Adres silindi");
    } catch (error: any) {
      setAddressError(error.response?.data?.message || "Adres silinemedi");
    }
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    return cleaned.slice(0, 16);
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const openPaymentMethodModal = (paymentMethod?: any) => {
    if (paymentMethod) {
      setEditingPaymentMethod(paymentMethod);
      setPaymentMethodForm({
        cardNumber: `**** **** **** ${paymentMethod.card_last4}`,
        cardHolderName: paymentMethod.card_holder,
        expiryDate: "",
      });
    } else {
      setEditingPaymentMethod(null);
      setPaymentMethodForm({
        cardNumber: "",
        cardHolderName: "",
        expiryDate: "",
      });
    }
    setPaymentMethodSuccess("");
    setPaymentMethodError("");
    setPaymentMethodModalOpened(true);
  };

  const handleSavePaymentMethod = async () => {
    if (
      !paymentMethodForm.cardNumber ||
      paymentMethodForm.cardNumber.length !== 16
    ) {
      setPaymentMethodError("Kart numarası 16 haneli olmalıdır");
      return;
    }

    if (
      !paymentMethodForm.cardHolderName ||
      paymentMethodForm.cardHolderName.length < 3
    ) {
      setPaymentMethodError("Kart sahibi adı en az 3 karakter olmalıdır");
      return;
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(paymentMethodForm.expiryDate)) {
      setPaymentMethodError("Geçerli bir tarih girin (MM/YY)");
      return;
    }

    if (!token) return;

    try {
      setPaymentMethodLoading(true);
      setPaymentMethodError("");

      await paymentMethodsApi.create(
        {
          cardNumber: paymentMethodForm.cardNumber,
          cardHolderName: paymentMethodForm.cardHolderName,
          expiryDate: paymentMethodForm.expiryDate,
        },
        token
      );

      setPaymentMethodSuccess("Kart eklendi");
      await fetchPaymentMethods();
      setPaymentMethodModalOpened(false);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        (Array.isArray(error.response?.data?.message)
          ? error.response?.data?.message[0]
          : "İşlem başarısız oldu");
      setPaymentMethodError(errorMessage);
    } finally {
      setPaymentMethodLoading(false);
    }
  };

  const handleDeletePaymentMethod = async (id: number) => {
    if (!token) return;
    if (!confirm("Bu kartı silmek istediğinizden emin misiniz?")) return;

    try {
      await paymentMethodsApi.delete(id, token);
      await fetchPaymentMethods();
      setPaymentMethodSuccess("Kart silindi");
    } catch (error: any) {
      setPaymentMethodError(error.response?.data?.message || "Kart silinemedi");
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

          {addressSuccess && (
            <Alert
              icon={<IconCheck size={16} />}
              color="green"
              title="Başarılı"
              mb="md"
            >
              {addressSuccess}
            </Alert>
          )}

          {addressError && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              color="red"
              title="Hata"
              mb="md"
            >
              {addressError}
            </Alert>
          )}

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
                      {address.title && (
                        <Badge size="sm">{address.title}</Badge>
                      )}
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
              onClick={() => openPaymentMethodModal()}
              size="sm"
            >
              Yeni Kart
            </Button>
          </Group>

          {paymentMethodSuccess && (
            <Alert
              icon={<IconCheck size={16} />}
              color="green"
              title="Başarılı"
              mb="md"
            >
              {paymentMethodSuccess}
            </Alert>
          )}

          {paymentMethodError && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              color="red"
              title="Hata"
              mb="md"
            >
              {paymentMethodError}
            </Alert>
          )}

          {paymentMethods.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">
              Henüz kayıtlı kart yok
            </Text>
          ) : (
            <Stack gap="md">
              {paymentMethods.map((method) => (
                <Paper key={method.id} p="md" withBorder>
                  <Group justify="space-between" mb="xs">
                    <Group gap="xs">
                      <IconCreditCard size={18} />
                      <Badge size="sm">
                        {method.provider || "CREDIT_CARD"}
                      </Badge>
                    </Group>
                    <Group gap="xs">
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => handleDeletePaymentMethod(method.id)}
                      >
                        <IconTrash size={18} />
                      </ActionIcon>
                    </Group>
                  </Group>
                  <Text size="sm" fw={500}>
                    **** **** **** {method.card_last4}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {method.card_holder}
                  </Text>
                </Paper>
              ))}
            </Stack>
          )}
        </Paper>

        <Paper shadow="none" p="xl" withBorder>
          <Text fz={20} fw={500} mb="md">
            Profil Bilgileri
          </Text>

          <Stack gap="md">
            <TextInput
              label="Email"
              value={user?.email || ""}
              disabled
              leftSection={<IconMail size={18} />}
              styles={{
                input: {
                  backgroundColor: "#f8f9fa",
                },
              }}
            />

            <TextInput
              label="İsim"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="İsminiz"
              leftSection={<IconUser size={18} />}
            />

            {profileSuccess && (
              <Alert
                icon={<IconCheck size={16} />}
                color="green"
                title="Başarılı"
              >
                {profileSuccess}
              </Alert>
            )}

            {profileError && (
              <Alert
                icon={<IconAlertCircle size={16} />}
                color="red"
                title="Hata"
              >
                {profileError}
              </Alert>
            )}

            <Group justify="flex-end" mt="md">
              <Button onClick={handleUpdateProfile} loading={profileLoading}>
                Profili Güncelle
              </Button>
            </Group>
          </Stack>
        </Paper>

        <Paper shadow="none" p="xl" withBorder>
          <Text fz={20} fw={500} mb="md">
            Şifre Değiştir
          </Text>

          <Stack gap="md">
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

            {passwordSuccess && (
              <Alert
                icon={<IconCheck size={16} />}
                color="green"
                title="Başarılı"
              >
                {passwordSuccess}
              </Alert>
            )}

            {passwordError && (
              <Alert
                icon={<IconAlertCircle size={16} />}
                color="red"
                title="Hata"
              >
                {passwordError}
              </Alert>
            )}

            <Group justify="flex-end" mt="md">
              <Button onClick={handleChangePassword} loading={passwordLoading}>
                Şifreyi Değiştir
              </Button>
            </Group>
          </Stack>
        </Paper>
      </Stack>

      <Modal
        opened={addressModalOpened}
        onClose={() => setAddressModalOpened(false)}
        title={editingAddress ? "Adresi Düzenle" : "Yeni Adres Ekle"}
      >
        <Stack gap="md">
          <TextInput
            label="Adres Başlığı (Opsiyonel)"
            placeholder="Ev, İş, vb."
            leftSection={<IconHome size={18} />}
            value={addressForm.title}
            onChange={(e) =>
              setAddressForm({ ...addressForm, title: e.target.value })
            }
          />

          <TextInput
            label="Ad Soyad"
            placeholder="Ahmet Yılmaz"
            leftSection={<IconUser size={18} />}
            value={addressForm.fullName}
            onChange={(e) =>
              setAddressForm({ ...addressForm, fullName: e.target.value })
            }
            required
          />

          <TextInput
            label="Telefon"
            placeholder="05XX XXX XX XX"
            leftSection={<IconPhone size={18} />}
            value={addressForm.phone}
            onChange={(e) =>
              setAddressForm({
                ...addressForm,
                phone: formatPhone(e.target.value),
              })
            }
            required
          />

          <Textarea
            label="Adres"
            placeholder="Mahalle, Sokak, No, vb."
            leftSection={<IconMapPin size={18} />}
            value={addressForm.addressLine}
            onChange={(e) =>
              setAddressForm({ ...addressForm, addressLine: e.target.value })
            }
            minRows={3}
            required
          />

          <Group grow>
            <TextInput
              label="Şehir"
              placeholder="İstanbul"
              value={addressForm.city}
              onChange={(e) =>
                setAddressForm({ ...addressForm, city: e.target.value })
              }
              required
            />

            <TextInput
              label="İlçe"
              placeholder="Kadıköy"
              value={addressForm.district}
              onChange={(e) =>
                setAddressForm({ ...addressForm, district: e.target.value })
              }
              required
            />
          </Group>

          {addressError && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              color="red"
              title="Hata"
            >
              {addressError}
            </Alert>
          )}

          <Group justify="flex-end" mt="md">
            <Button
              variant="outline"
              onClick={() => setAddressModalOpened(false)}
            >
              İptal
            </Button>
            <Button onClick={handleSaveAddress} loading={addressLoading}>
              {editingAddress ? "Güncelle" : "Ekle"}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={paymentMethodModalOpened}
        onClose={() => setPaymentMethodModalOpened(false)}
        title="Yeni Kart Ekle"
      >
        <Stack gap="md">
          <TextInput
            label="Kart Numarası"
            placeholder="1234 5678 9012 3456"
            leftSection={<IconCreditCard size={18} />}
            value={paymentMethodForm.cardNumber}
            onChange={(e) =>
              setPaymentMethodForm({
                ...paymentMethodForm,
                cardNumber: formatCardNumber(e.target.value),
              })
            }
            required
          />

          <TextInput
            label="Kart Sahibi"
            placeholder="AHMET YILMAZ"
            leftSection={<IconUser size={18} />}
            value={paymentMethodForm.cardHolderName}
            onChange={(e) =>
              setPaymentMethodForm({
                ...paymentMethodForm,
                cardHolderName: e.target.value.toUpperCase(),
              })
            }
            required
          />

          <TextInput
            label="Son Kullanma Tarihi"
            placeholder="MM/YY"
            leftSection={<IconCalendar size={18} />}
            value={paymentMethodForm.expiryDate}
            onChange={(e) =>
              setPaymentMethodForm({
                ...paymentMethodForm,
                expiryDate: formatExpiryDate(e.target.value),
              })
            }
            required
          />

          {paymentMethodError && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              color="red"
              title="Hata"
            >
              {paymentMethodError}
            </Alert>
          )}

          <Group justify="flex-end" mt="md">
            <Button
              variant="outline"
              onClick={() => setPaymentMethodModalOpened(false)}
            >
              İptal
            </Button>
            <Button
              onClick={handleSavePaymentMethod}
              loading={paymentMethodLoading}
            >
              Ekle
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
};

export default Profile;
