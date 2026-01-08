import { useEffect } from "react";
import { useLogout } from "../../hooks/useLogout";

export function Painel() {
  const { logout } = useLogout();

  useEffect(() => {
    const timer = setTimeout(() => {
      logout();
    }, 5000); // 5 segundos

    // cleanup (boa prática)
    return () => clearTimeout(timer);
  }, [logout]);

  return (
    <>
      <div>
        <h1>Painel</h1>
        <p>Você será deslogado automaticamente em 5 segundos...</p>
      </div>
    </>
  );
}
