export const getAuthToken = (): string | null => {
  const raw = localStorage.getItem("token");
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === "string" && parsed.length > 0) {
      return parsed;
    }
  } catch {
    const trimmed = raw.trim();
    if (trimmed.length > 0) {
      return trimmed.replace(/^"|"$/g, "");
    }
  }

  return null;
};
