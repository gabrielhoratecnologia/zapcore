import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase.js";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [apiToken, setApiToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setApiToken(null);
        setLoading(false);
        return;
      }

      try {
        const token = await currentUser.getIdToken(true);

        setUser(currentUser);
        setApiToken(token);
      } catch (err) {
        console.error("Erro ao pegar token Firebase", err);
        setUser(currentUser);
        setApiToken(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return {
    user,
    uid: user?.uid || null,
    apiToken,
    isAuthenticated: !!user,
    loading,
  };
}
