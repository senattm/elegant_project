import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

export type NotificationType = "success" | "error" | "info" | "warning";

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (message: string, type: NotificationType) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback(
    (message: string, type: NotificationType) => {
      const id = Math.random().toString(36).substr(2, 9);
      setNotifications((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        removeNotification(id);
      }, 3000);
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, addNotification, removeNotification }}
    >
      {children}
      <div
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {notifications.map((notification) => (
          <div
            key={notification.id}
            style={{
              padding: "12px 20px",
              borderRadius: 8,
              backgroundColor:
                notification.type === "success"
                  ? "#51cf66"
                  : notification.type === "error"
                  ? "#ff6b6b"
                  : notification.type === "warning"
                  ? "#ffd43b"
                  : "#339af0",
              color: "white",
              fontWeight: 500,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              minWidth: 250,
              cursor: "pointer",
              animation: "slideIn 0.3s ease-out",
            }}
            onClick={() => removeNotification(notification.id)}
          >
            {notification.message}
          </div>
        ))}
      </div>
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within NotificationProvider"
    );
  }
  return context;
};


