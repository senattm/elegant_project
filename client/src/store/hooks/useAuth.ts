import { useAtom } from "jotai";
import {
  userAtom,
  tokenAtom,
  isAuthenticatedAtom,
  favoritesAtom,
  cartAtom,
} from "../atoms";
import { useNotification } from "./useNotification";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

interface AuthResponse {
  user: {
    id: number;
    name: string;
    email: string;
  };
  token: string;
  message?: string;
}

export const useAuth = () => {
  const [user, setUser] = useAtom(userAtom);
  const [token, setToken] = useAtom(tokenAtom);
  const [isAuthenticated] = useAtom(isAuthenticatedAtom);
  const [, setFavorites] = useAtom(favoritesAtom);
  const [, setCart] = useAtom(cartAtom);
  const { addNotification } = useNotification();

  const authRequest = async (
    path: string,
    body: Record<string, unknown>
  ): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      const message = Array.isArray(data.message)
        ? data.message[0]
        : data.message || data.error || "İşlem başarısız";
      throw new Error(message);
    }

    return data;
  };

  const login = async (email: string, password: string) => {
    try {
      const data = await authRequest("/auth/login", { email, password });
      setUser(data.user);
      setToken(data.token);
      addNotification("Başarıyla giriş yaptınız!", "success");
      return data;
    } catch (error: any) {
      addNotification(error.message || "Giriş başarısız", "error");
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const data = await authRequest("/auth/register", {
        name,
        email,
        password,
      });
      setUser(data.user);
      setToken(data.token);
      addNotification("Hesabınız oluşturuldu!", "success");
      return data;
    } catch (error: any) {
      addNotification(error.message || "Kayıt başarısız", "error");
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setFavorites([]);
    setCart([]);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("favorites");
    addNotification("Çıkış yapıldı", "info");
  };

  return {
    user,
    token,
    isAuthenticated,
    login,
    register,
    logout,
  };
};
