import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Faz o scroll suave para o topo ao trocar de página
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  return null;
}
