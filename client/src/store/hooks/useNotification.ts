import { notifications } from "@mantine/notifications";
import { IconCheck, IconX, IconInfoCircle } from "@tabler/icons-react";
import { createElement } from "react";

type NotificationType = "success" | "error" | "info";

export const notificationConfig = {
  position: "top-right" as const,
  zIndex: 10000,
  limit: 3,
};

export const useNotification = () => {
  const addNotification = (
    message: string,
    type: NotificationType = "info"
  ) => {
    const configs = {
      success: {
        color: "green",
        Icon: IconCheck,
        title: "Başarılı",
      },
      error: {
        color: "red",
        Icon: IconX,
        title: "Hata",
      },
      info: {
        color: "red",
        Icon: IconInfoCircle,
        title: "Başarılı",
      },
    };

    const config = configs[type];

    notifications.show({
      title: config.title,
      message,
      color: config.color,
      icon: createElement(config.Icon, { size: 18 }),
      autoClose: 3000,
    });
  };

  return {
    addNotification,
  };
};
