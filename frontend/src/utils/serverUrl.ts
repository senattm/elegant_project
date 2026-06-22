export const getServerUrl = (): string => {
  return (
    import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000"
  );
};

