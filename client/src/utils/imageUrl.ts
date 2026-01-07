import { getServerUrl } from "./serverUrl";

export const getImageUrl = (url: string | undefined | null): string => {
  if (!url) return "https://via.placeholder.com/150";
  
  if (url.startsWith("http")) {
    return url;
  }
  
  const serverUrl = getServerUrl();
  
  // Eğer URL zaten /images/ ile başlamıyorsa ekle
  if (!url.startsWith("/images/") && !url.startsWith("images/")) {
    return `${serverUrl}/images/${url}`;
  }
  
  // Eğer images/ ile başlıyorsa (başında / yoksa) ekle
  if (url.startsWith("images/")) {
    return `${serverUrl}/${url}`;
  }
  
  // Zaten /images/ ile başlıyorsa direkt ekle
  return `${serverUrl}${url}`;
};


