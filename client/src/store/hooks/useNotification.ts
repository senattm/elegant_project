import { notifications } from "@mantine/notifications";
import {
  IconCheck,
  IconX,
  IconInfoCircle,
  IconLogin2,
  IconLogout,
  IconUserPlus,
} from "@tabler/icons-react";
import { createElement, useCallback, type ReactNode } from "react";

type NotificationType = "success" | "error" | "info";
export type AuthNotificationKind = "login" | "logout" | "register";

export const notificationConfig = {
  position: "top-right" as const,
  zIndex: 10000,
  limit: 3,
};

const iconColors = {
  success: "#2f9e44",
  error: "#e03131",
  info: "#364fc7",
  login: "#2f9e44",
  register: "#2f9e44",
  logout: "#868e96",
} as const;

const baseNotificationStyles = {
  root: {
    backgroundColor: "#ffffff",
    border: "1px solid rgba(0, 0, 0, 0.08)",
    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.1)",
    padding: "14px 16px",
    "&::before": {
      display: "none",
    },
  },
  title: {
    color: "#1a1a1a",
    fontFamily: '"Playfair Display", serif',
    fontWeight: 300,
    letterSpacing: "0.14em",
    fontSize: "12px",
    marginBottom: 4,
  },
  description: {
    color: "rgba(0, 0, 0, 0.62)",
    fontFamily: '"Montserrat", sans-serif',
    fontSize: "13px",
    lineHeight: 1.45,
  },
  closeButton: {
    color: "rgba(0, 0, 0, 0.35)",
    "&:hover": {
      backgroundColor: "rgba(0, 0, 0, 0.05)",
    },
  },
};

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const buildNotificationStyles = (iconColor: string) => ({
  ...baseNotificationStyles,
  root: {
    ...baseNotificationStyles.root,
    "--notification-color": iconColor,
  },
  icon: {
    backgroundColor: hexToRgba(iconColor, 0.12),
    color: iconColor,
  },
});

const coloredIcon = (
  Icon: typeof IconCheck,
  color: string,
  size = 20
): ReactNode =>
  createElement(Icon, {
    size,
    stroke: 1.5,
    color,
    style: { color, display: "block" },
  });

const AUTH_NOTIFICATION_CONTENT: Record<
  AuthNotificationKind,
  { title: string; icon: ReactNode; iconColor: string }
> = {
  login: {
    title: "Başarıyla giriş yaptınız",
    icon: coloredIcon(IconLogin2, iconColors.login),
    iconColor: iconColors.login,
  },
  register: {
    title: "Hesabınız başarıyla oluşturuldu",
    icon: coloredIcon(IconUserPlus, iconColors.register),
    iconColor: iconColors.register,
  },
  logout: {
    title: "Başarıyla çıkış yaptınız",
    icon: coloredIcon(IconLogout, iconColors.logout),
    iconColor: iconColors.logout,
  },
};

const notificationShowDefaults = {
  autoClose: 3500,
  withBorder: false,
  radius: 0,
} as const;

export const useNotification = () => {
  const addNotification = useCallback((
    message: string,
    type: NotificationType = "info"
  ) => {
    const configs = {
      success: {
        Icon: IconCheck,
        title: "Başarılı",
        iconColor: iconColors.success,
      },
      error: {
        Icon: IconX,
        title: "Hata",
        iconColor: iconColors.error,
      },
      info: {
        Icon: IconInfoCircle,
        title: "Bilgi",
        iconColor: iconColors.info,
      },
    };

    const config = configs[type];

    notifications.show({
      ...notificationShowDefaults,
      id: `${type}-${message.slice(0, 24)}`,
      title: config.title,
      message,
      icon: coloredIcon(config.Icon, config.iconColor, 18),
      styles: buildNotificationStyles(config.iconColor),
    });
  }, []);

  const showAuthNotification = useCallback((kind: AuthNotificationKind) => {
    const content = AUTH_NOTIFICATION_CONTENT[kind];

    notifications.show({
      ...notificationShowDefaults,
      id: `auth-${kind}`,
      title: content.title,
      icon: content.icon,
      styles: buildNotificationStyles(content.iconColor),
      autoClose: kind === "logout" ? 3200 : 4000,
    });
  }, []);

  return {
    addNotification,
    showAuthNotification,
  };
};
