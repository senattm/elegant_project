import { getServerUrl } from "./serverUrl";

export const getImageUrl = (url: string | undefined | null): string => {
  if (!url) return "https://via.placeholder.com/150";
  
  if (url.startsWith("http")) {
    return url;
  }
  
  const serverUrl = getServerUrl();
  let formattedUrl = url.startsWith('/') ? url.slice(1) : url;
  
  if (!formattedUrl.startsWith("images/")) {
    if (!formattedUrl.startsWith("products/")) {
      formattedUrl = `images/products/${formattedUrl}`;
    } else {
      formattedUrl = `images/${formattedUrl}`;
    }
  }
  
  return `${serverUrl}/${formattedUrl}`;
};


