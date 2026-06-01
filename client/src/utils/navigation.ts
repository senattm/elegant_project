import type { NavigateFunction } from "react-router-dom";

export function navigateToStore(
  navigate: NavigateFunction,
  options?: { category?: string; scrollTop?: boolean },
) {
  if (options?.category) {
    navigate(`/store?category=${encodeURIComponent(options.category)}`);
  } else {
    navigate("/store");
  }
  if (options?.scrollTop !== false) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}
