import { getServerUrl } from "./serverUrl";

export const getImageUrl = (url: string | undefined | null): string => {
  if (!url) return "https://via.placeholder.com/150";
  
  if (url.startsWith("http")) {
    return url;
  }
  
  const serverUrl = getServerUrl();
  
  if (!url.startsWith("/images/") && !url.startsWith("images/")) {
    return `${serverUrl}/images/${url}`;
  }
  
  if (url.startsWith("images/")) {
    return `${serverUrl}/${url}`;
  }
  
  return `${serverUrl}${url}`;
};


