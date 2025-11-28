import { useAtom } from "jotai";
import { notificationsAtom } from "../atoms";
import { useCallback } from "react";

type NotificationType = "success" | "error" | "info" | "warning";

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

export const useNotification = () => {
  const [notifications, setNotifications] = useAtom(notificationsAtom);

  const addNotification = useCallback(
    (message: string, type: NotificationType) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newNotification: Notification = { id, message, type };

      setNotifications((prev) => [...prev, newNotification]);

      setTimeout(() => {
        removeNotification(id);
      }, 3000);
    },
    [setNotifications]
  );

  const removeNotification = useCallback(
    (id: string) => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    },
    [setNotifications]
  );

  return {
    notifications,
    addNotification,
    removeNotification,
  };
};

