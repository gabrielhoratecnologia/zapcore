import { useState, useEffect } from "react";
import { useLogin } from "../../hooks/useLogin.jsx";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.jsx";
import { useAnalytics } from "../../hooks/useAnalytics";
import { useResetPassword } from "../../hooks/useResetPassword";
import {
  FaSignInAlt,
  FaKey,
  FaExclamationCircle,
  FaCheckCircle,
} from "react-icons/fa";
import "./LoginForm.css";

export function LoginForm() {
  useAnalytics();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [showTerms, setShowTerms] = useState(false);

  // Estados locais para controle de banners
  const [localError, setLocalError] = useState(null);
  const [localSuccess, setLocalSuccess] = useState(null);

  const { login, loading, erro: loginErro } = useLogin();
  const {
    resetPassword,
    loading: resetLoading,
    erro: resetErro,
    sucesso: resetSucesso,
  } = useResetPassword();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Sincroniza erros e sucessos dos hooks
  useEffect(() => {
    if (loginErro) setLocalError(loginErro);
    if (resetErro) setLocalError(resetErro);
    if (resetSucesso) setLocalSuccess(resetSucesso);
  }, [loginErro, resetErro, resetSucesso]);

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/painel");
    }
  }, [authLoading, user, navigate]);

  const handleInteraction = () => {
    setLocalError(null);
    setLocalSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    handleInteraction();
    await login(email, password);
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    handleInteraction();
    await resetPassword(resetEmail);
  };

  const toggleScreen = (screen) => {
    handleInteraction();
    if (screen === "reset") {
      setShowReset(true);
      setShowTerms(false);
    } else if (screen === "terms") {
      setShowTerms(true);
      setShowReset(false);
    } else {
      setShowReset(false);
      setShowTerms(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-card">
        <div className="card-header">
          <h1 className="brand-title">
            <span className="brand-main">Seravalli</span>
            <span className="brand-sub">Atendimento</span>
          </h1>
        </div>

        {/* Banner de Erro */}
        {localError && (
          <div className="message error-message">
            <FaExclamationCircle /> {localError}
          </div>
        )}

        {/* Banner de Sucesso */}
        {localSuccess && (
          <div className="message success-message">
            <FaCheckCircle /> {localSuccess}
          </div>
        )}

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
                onFocus={handleInteraction}
                required
                disabled={loading}
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
                onFocus={handleInteraction}
                required
                disabled={loading}
                className="clean-input"
              />
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? (
                "Carregando..."
              ) : (
                <>
                  <FaSignInAlt /> Entrar
                </>
              )}
            </button>

            <div className="forgot-link-container">
              <button
                type="button"
                className="link-button"
                onClick={() => toggleScreen("reset")}
                disabled={loading}
              >
                Esqueci minha senha
              </button>
            </div>
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
                onFocus={handleInteraction}
                required
                disabled={resetLoading}
                className="clean-input"
              />
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={resetLoading}
            >
              {resetLoading ? (
                "Enviando..."
              ) : (
                <>
                  <FaKey /> Recuperar Senha
                </>
              )}
            </button>

            <div className="forgot-link-container">
              <button
                type="button"
                className="link-button"
                onClick={() => toggleScreen("login")}
              >
                Voltar ao login
              </button>
            </div>
          </form>
        )}

        {/* -------------------- TERMOS -------------------- */}
        {showTerms && (
          <div className="login-form">
            <div className="termos-box">
              <h3>Termos e Condições de Uso</h3>
              <p>
                Ao acessar o sistema <strong>Seravalli Atendimento</strong>,
                você concorda com os termos de uso e privacidade de dados
                (LGPD).
              </p>
              <h4>1. Finalidade</h4>
              <p>Uso exclusivo para gestão de atendimentos Seravalli.</p>
              <h4>2. Responsabilidade</h4>
              <p>O usuário é responsável pelo sigilo de sua senha e acesso.</p>
            </div>
            <div className="forgot-link-container">
              <button
                type="button"
                className="link-button"
                onClick={() => toggleScreen("login")}
              >
                Voltar ao login
              </button>
            </div>
          </div>
        )}

        {!showTerms && (
          <div className="card-footer">
            Ao continuar, você concorda com nossos{" "}
            <button
              type="button"
              className="link-button"
              onClick={() => toggleScreen("terms")}
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
