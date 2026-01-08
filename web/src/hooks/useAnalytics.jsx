import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { analytics } from "../firebase.js";
import { logEvent } from "firebase/analytics";

/**
 * Hook para integrar Firebase Analytics
 * - Track automático de page_view
 * - Função para logar eventos personalizados
 */
export const useAnalytics = () => {
  const location = useLocation();

  // Track de página automaticamente
  useEffect(() => {
    logEvent(analytics, "page_view", {
      page_path: location.pathname,
      page_title: document.title,
    });
  }, [location]);

  /**
   * Log de evento personalizado
   * @param {string} name Nome do evento
   * @param {object} params Parâmetros do evento
   */
  const logCustomEvent = (name, params = {}) => {
    logEvent(analytics, name, params);
  };

  return { logCustomEvent };
};
