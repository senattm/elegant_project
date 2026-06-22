import { getServerUrl } from "./serverUrl";

export const isPolyvoreImage = (url: string | undefined | null): boolean =>
  !!url && url.includes("polyvore-images");

export const isPolyvoreProduct = (
  source?: string | null,
  url?: string | null,
): boolean => source === "polyvore" || isPolyvoreImage(url);

export const getProductImageFit = (
  url: string | undefined | null,
  defaultFit: "cover" | "contain" = "cover",
  source?: string | null,
): "cover" | "contain" =>
  isPolyvoreProduct(source, url) ? "contain" : defaultFit;

export const getProductImageBackground = (
  url: string | undefined | null,
  source?: string | null,
): string | undefined => (isPolyvoreProduct(source, url) ? "#ffffff" : undefined);

export const getImageUrl = (url: string | undefined | null): string => {
  if (!url) return "https://via.placeholder.com/150";

  if (url.startsWith("http")) {
    return url;
  }

  const serverUrl = getServerUrl();
  let formattedUrl = url.startsWith("/") ? url.slice(1) : url;

  if (formattedUrl.startsWith("polyvore-images/")) {
    return `${serverUrl}/${formattedUrl}`;
  }

  if (!formattedUrl.startsWith("images/")) {
    if (!formattedUrl.startsWith("products/")) {
      formattedUrl = `images/products/${formattedUrl}`;
    } else {
      formattedUrl = `images/${formattedUrl}`;
    }
  }

  return `${serverUrl}/${formattedUrl}`;
};
