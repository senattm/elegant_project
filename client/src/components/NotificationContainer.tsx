import { useNotification } from "../store/hooks";

export const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotification();

  return (
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
    </div>
  );
};
