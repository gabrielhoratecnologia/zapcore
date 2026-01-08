// hooks/useLogout.js
import { useCallback } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase.js";
import { useNavigate } from "react-router-dom";

export function useLogout() {
  const navigate = useNavigate();

  const logout = useCallback(async () => {
    try {
      await signOut(auth);

      localStorage.clear();
      sessionStorage.clear();

      // 3️⃣ Redireciona para a tela de login
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  }, [navigate]);

  return { logout };
}
