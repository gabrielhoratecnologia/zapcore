import { useState, useEffect } from "react";
//import { useLogin } from "../../hooks/useLogin.jsx";
import { useNavigate } from "react-router-dom";
//import { useAuth } from "../../hooks/useAuth.jsx";
//import { useAnalytics } from "../../hooks/useAnalytics";
//import { useResetPassword } from "../../hooks/useResetPassword";
//import Termos from "../../pages/Termos/Termos.jsx";
//import { FaSignInAlt, FaKey } from "react-icons/fa"; // Ícones reativados para os botões
//import { LoadingSpinner } from "../../components/Loading/LoadingSpinner.jsx";
import "./LoginForm.css";

export function LoginForm() {
  // Chamada do hook de Analytics no início
  //useAnalytics();

  // Estados para login e senha
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Hooks principais
  //const { login, loading, erro } = useLogin();
  const navigate = useNavigate();

  // Desestruturação do useAuth
  //const { user, loading: authLoading } = useAuth();

  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  // Termos e condições
  const [showTerms, setShowTerms] = useState(false);

  /** useEffect(() => {
    if (!authLoading && user) {
      navigate("/painel");
    }
  }, [authLoading, user, navigate]); 
  */

  // Handler para o login
  const handleSubmit = (e) => {
    e.preventDefault();
    // login(email, password);
    console.log("Login disparado");
  };

  // Handler para redefinição de senha
  const handleResetSubmit = (e) => {
    e.preventDefault();
    // resetPassword(resetEmail);
    console.log("Reset disparado");
  };

  // O JSX incorpora as 3 telas (Login, Reset, Termos)
  return (
    <div className="login-page-wrapper">
      <div className="login-card">
        <div className="card-header">
          <h1 className="brand-title">
            <span className="brand-main">Seravalli</span>
            <span className="brand-sub">Atendimento</span>
          </h1>
        </div>

        {/* -------------------- LOGIN -------------------- */}
        {!showReset && !showTerms && (
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                placeholder="exemplo@musica.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="clean-input"
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Senha</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="clean-input"
              />
            </div>

            <button type="submit" className="login-button">
              
            </button>

            <p className="forgot-link">
              <button
                type="button"
                className="link-button"
                onClick={() => setShowReset(true)}
              >
                Esqueci minha senha
              </button>
            </p>
          </form>
        )}

        {/* -------------------- RESET DE SENHA -------------------- */}
        {showReset && !showTerms && (
          <form className="login-form" onSubmit={handleResetSubmit}>
            <div className="input-group">
              <label htmlFor="resetEmail">Seu e-mail</label>
              <input
                id="resetEmail"
                type="email"
                placeholder="exemplo@musica.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                className="clean-input"
              />
            </div>

            <button type="submit" className="login-button">
              <FaKey /> Recuperar Senha
            </button>

            <p className="forgot-link">
              <button
                type="button"
                className="link-button"
                onClick={() => setShowReset(false)}
              >
                Voltar ao login
              </button>
            </p>
          </form>
        )}

        {/* -------------------- TERMOS E CONDIÇÕES -------------------- */}
        {showTerms && (
          <div className="login-form">
            <div className="termos-box">
              {/* <Termos /> */}
              <p>Conteúdo dos termos e condições...</p>
            </div>
            <p className="forgot-link">
              <button
                type="button"
                className="link-button"
                onClick={() => setShowTerms(false)}
              >
                Voltar ao login
              </button>
            </p>
          </div>
        )}

        {/* -------------------- FOOTER -------------------- */}
        {!showTerms && (
          <div className="card-footer">
            Ao continuar, você concorda com nossos{" "}
            <button
              type="button"
              className="link-button"
              onClick={() => setShowTerms(true)}
            >
              Termos e Condições
            </button>
            .
          </div>
        )}
      </div>
    </div>
  );
}
