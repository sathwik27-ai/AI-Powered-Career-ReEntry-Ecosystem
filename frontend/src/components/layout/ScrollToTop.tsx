import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Start each page at the top unless the URL points at an anchor. */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}
