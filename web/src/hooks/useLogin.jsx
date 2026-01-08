import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase.js";
import { useNavigate } from "react-router-dom";

export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const navigate = useNavigate();

  const login = async (email, senha) => {
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        senha
      );

      const user = userCredential.user;
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      };

      console.log("Usuário Logado", user);
      navigate("/painel");
    } catch (error) {
      console.error("Erro no login", error.message);

      setErro("E-mail ou senha inválidos");
    }

    setLoading(false);
  };

  return { login, loading, erro };
}
