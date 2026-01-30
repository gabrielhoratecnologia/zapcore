import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase.js";
import { setApiAuthToken } from "../api/api.js";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [apiToken, setApiToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setApiToken(null);
        setApiAuthToken(null);
        setLoading(false);
        return;
      }

      try {
        const token = await currentUser.getIdToken(true);

        setUser(currentUser);
        setApiToken(token);
        setApiAuthToken(token);
      } catch (err) {
        console.error("Erro ao pegar token", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        apiToken,
        uid: user?.uid || null,
        isAuthenticated: !!user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
