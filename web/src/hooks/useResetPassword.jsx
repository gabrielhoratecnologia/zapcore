import { useState } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

export const useResetPassword = () => {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(null);

  const resetPassword = async (email) => {
    setLoading(true);
    setErro(null);
    setSucesso(null);
    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email);
      setSucesso("Enviamos um link de redefinição de senha para seu e-mail.");
    } catch (error) {
      console.error(error.message);
      if (error.code === "auth/user-not-found") {
        setErro("Usuário não encontrado. Verifique o e-mail informado.");
      } else if (error.code === "auth/invalid-email") {
        setErro("E-mail inválido. Tente novamente.");
      } else {
        setErro("Não foi possível enviar o link. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return { resetPassword, loading, erro, sucesso };
};
