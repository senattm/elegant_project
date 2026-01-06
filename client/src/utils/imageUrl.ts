import { getServerUrl } from "./serverUrl";

export const getImageUrl = (url: string | undefined | null): string => {
  if (!url) return "https://via.placeholder.com/150";
  
  if (url.startsWith("http")) {
    return url;
  }
  
  const serverUrl = getServerUrl();
  return `${serverUrl}${url}`;
};


