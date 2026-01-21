import { useState, useEffect } from "react";
import { loginSchema, registerSchema } from "../schemas/auth";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Flex,
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
import { useAuth, useNotification } from "../store/hooks";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
  }, [isLogin]);

  const { login: authLogin, register: authRegister } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const imageBoxStyle = {
    backgroundImage: "url(http://localhost:5000/images/deneme.jpg)",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const result = loginSchema.safeParse({
          email: formData.email,
          password: formData.password
        });

        if (!result.success) {
          addNotification(result.error.issues[0].message, "error");
          setLoading(false);
          return;
        }

        await authLogin(formData.email, formData.password);
        navigate("/");
      } else {
        const result = registerSchema.safeParse(formData);

        if (!result.success) {
          addNotification(result.error.issues[0].message, "error");
          setLoading(false);
          return;
        }

        await authRegister(formData.name, formData.email, formData.password);
        navigate("/");
      }
    } catch (error: unknown) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex mih="100vh" pos="relative">
      <Box w="55%" className="bg-auth-image" style={imageBoxStyle} pos="relative">
        <Box pos="absolute" top={40} left={40}>
          <Text className="text-logo">ELEGĀNT</Text>
        </Box>

        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={18} />}
          onClick={() => navigate("/")}
          pos="absolute"
          top={40}
          right={40}
          c="white"
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

      <Flex w="45%" align="center" justify="center" bg="white" p={40}>
        <Box w="100%" maw={420}>
          <Title order={1} mb="xs" className="text-title-large">
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
                  className="elegant-input"
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
                className="elegant-input"
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
                className="elegant-input"
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
                  className="elegant-input"
                />
              )}

              <Button type="submit" fullWidth loading={loading}>
                {isLogin ? "GİRİŞ YAP" : "HESAP OLUŞTUR"}
              </Button>
            </Stack>
          </form>

          <Divider my={32} label="VEYA" labelPosition="center" />

          <Text size="sm" ta="center" c="dimmed">
            {isLogin ? "Hesabınız yok mu?" : "Zaten hesabınız var mı?"}{" "}
            <Text
              component="span"
              className="text-link"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Kayıt Ol" : "Giriş Yap"}
            </Text>
          </Text>
        </Box>
      </Flex>
    </Flex>
  );
};

export default Auth;
