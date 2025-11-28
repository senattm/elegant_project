import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Text,
  Title,
  Divider,
} from "@mantine/core";
import {
  IconMail,
  IconLock,
  IconUser,
  IconArrowLeft,
} from "@tabler/icons-react";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../contexts/NotificationContext";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const { login: authLogin, register: authRegister } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        if (!formData.email || !formData.password) {
          addNotification("Lütfen tüm alanları doldurun", "error");
          setLoading(false);
          return;
        }

        await authLogin(formData.email, formData.password);
        addNotification("Başarıyla giriş yaptınız!", "success");
        navigate("/");
      } else {
        if (
          !formData.name ||
          !formData.email ||
          !formData.password ||
          !formData.confirmPassword
        ) {
          addNotification("Lütfen tüm alanları doldurun", "error");
          setLoading(false);
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          addNotification("Şifreler eşleşmiyor", "error");
          setLoading(false);
          return;
        }

        if (formData.password.length < 6) {
          addNotification("Şifre en az 6 karakter olmalıdır", "error");
          setLoading(false);
          return;
        }

        await authRegister(formData.name, formData.email, formData.password);
        addNotification("Hesabınız oluşturuldu!", "success");
        navigate("/");
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Bir hata oluştu";

      addNotification(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      style={{
        minHeight: "100vh",
        display: "flex",
        position: "relative",
      }}
    >
      <Box
        style={{
          flex: "0 0 55%",
          backgroundImage: "url(http://localhost:5000/images/deneme.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
        }}
      >
        <Box
          style={{
            position: "absolute",
            top: 40,
            left: 40,
          }}
        >
          <Text
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: "2rem",
              color: "white",
              letterSpacing: "0.2em",
              fontWeight: 400,
              textShadow: "0 2px 10px rgba(0,0,0,0.3)",
            }}
          >
            ELEGĀNT
          </Text>
        </Box>

        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={18} />}
          onClick={() => navigate("/")}
          style={{
            position: "absolute",
            top: 40,
            right: 40,
            color: "white",
          }}
          styles={{
            root: {
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            },
          }}
        >
          Ana Sayfa
        </Button>
      </Box>

      <Box
        style={{
          flex: "0 0 45%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "white",
          padding: "40px",
        }}
      >
        <Box style={{ width: "100%", maxWidth: 420 }}>
          <Title
            order={1}
            mb="xs"
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: "2.2rem",
              fontWeight: 400,
              letterSpacing: "0.05em",
            }}
          >
            {isLogin ? "Hoş Geldiniz" : "Hesap Oluştur"}
          </Title>

          <Text c="dimmed" size="sm" mb={40}>
            {isLogin
              ? "Hesabınıza giriş yapmak için e-posta ve şifrenizi girin"
              : "Yeni bir hesap oluşturmak için bilgilerinizi girin"}
          </Text>

          <form onSubmit={handleSubmit}>
            <Stack gap="lg">
              {!isLogin && (
                <TextInput
                  label="Ad Soyad"
                  placeholder="Ad Soyad"
                  leftSection={<IconUser size={18} />}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  size="md"
                  styles={{
                    label: {
                      fontSize: "13px",
                      fontWeight: 500,
                      marginBottom: 8,
                      color: "#333",
                    },
                    input: {
                      borderColor: "#ddd",
                      "&:focus": {
                        borderColor: "black",
                      },
                    },
                  }}
                />
              )}

              <TextInput
                label="E-POSTA"
                placeholder="ornek@email.com"
                type="email"
                leftSection={<IconMail size={18} />}
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                size="md"
                styles={{
                  label: {
                    fontSize: "13px",
                    fontWeight: 500,
                    marginBottom: 8,
                    color: "#333",
                    letterSpacing: "0.05em",
                  },
                  input: {
                    borderColor: "#ddd",
                    "&:focus": {
                      borderColor: "black",
                    },
                  },
                }}
              />

              <PasswordInput
                label="ŞİFRE"
                placeholder="••••••••"
                leftSection={<IconLock size={18} />}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                size="md"
                styles={{
                  label: {
                    fontSize: "13px",
                    fontWeight: 500,
                    marginBottom: 8,
                    color: "#333",
                    letterSpacing: "0.05em",
                  },
                  input: {
                    borderColor: "#ddd",
                    "&:focus": {
                      borderColor: "black",
                    },
                  },
                }}
              />

              {!isLogin && (
                <PasswordInput
                  label="ŞİFRE TEKRAR"
                  placeholder="••••••••"
                  leftSection={<IconLock size={18} />}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  required
                  size="md"
                  styles={{
                    label: {
                      fontSize: "13px",
                      fontWeight: 500,
                      marginBottom: 8,
                      color: "#333",
                      letterSpacing: "0.05em",
                    },
                    input: {
                      borderColor: "#ddd",
                      "&:focus": {
                        borderColor: "black",
                      },
                    },
                  }}
                />
              )}

              <Button
                type="submit"
                fullWidth
                size="lg"
                loading={loading}
                styles={{
                  root: {
                    backgroundColor: "black",
                    height: 48,
                    fontSize: "14px",
                    letterSpacing: "0.1em",
                    fontWeight: 500,
                    "&:hover": {
                      backgroundColor: "#333",
                    },
                  },
                }}
              >
                {isLogin ? "GİRİŞ YAP" : "HESAP OLUŞTUR"}
              </Button>
            </Stack>
          </form>

          <Divider my={32} label="VEYA" labelPosition="center" />

          <Text size="sm" ta="center" c="dimmed">
            {isLogin ? "Hesabınız yok mu?" : "Zaten hesabınız var mı?"}{" "}
            <Text
              component="span"
              style={{
                color: "black",
                fontWeight: 600,
                cursor: "pointer",
                textDecoration: "underline",
              }}
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Kayıt Ol" : "Giriş Yap"}
            </Text>
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

export default Auth;
