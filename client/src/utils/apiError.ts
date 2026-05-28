export const getApiErrorMessage = (
  error: unknown,
  fallback = "İşlem başarısız"
): string => {
  if (error && typeof error === "object" && "response" in error) {
    const data = (error as { response?: { data?: { message?: unknown } } }).response
      ?.data;
    const message = data?.message;

    if (Array.isArray(message)) {
      return String(message[0] ?? fallback);
    }
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};
