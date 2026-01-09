import React, { useState } from "react";
import {
  FaSignOutAlt,
  FaBell,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import "./Header.css";

const Header = ({ userName, onLogout }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header className="main-header">
      <div className="header-container">
        {/* ESQUERDA: LOGO */}
        <div className="header-left">
          <div className="logo-container">
            <span className="logo-brand">Seravalli</span>
            <span className="logo-subtext">Atendimento</span>
          </div>
        </div>

        {/* CENTRO: ESPAÇO RESERVADO PARA FUTUROS COMPONENTES */}
        <div className="header-center">
          {/* Futuros componentes entrarão aqui */}
        </div>

        {/* DIREITA: AÇÕES */}
        <div className="header-right desktop-only">
          <button className="icon-button" aria-label="Notificações">
            <FaBell size={18} />
            <span className="notification-badge"></span>
          </button>

          <div className="divider"></div>

          <div className="user-profile">
            <div className="user-info">
              <span className="user-name">{userName || "Usuário"}</span>
              <div className="status-row">
                <span className="user-role">Administrador</span>
                <span
                  className={`status-dot ${isOnline ? "online" : "offline"}`}
                ></span>
              </div>
            </div>
            <button onClick={onLogout} className="logout-btn" title="Sair">
              <FaSignOutAlt size={18} />
            </button>
          </div>
        </div>

        <button className="mobile-menu-btn" onClick={toggleMenu}>
          {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
      </div>

      {/* MOBILE DRAWER */}
      <div className={`mobile-drawer ${isMenuOpen ? "open" : ""}`}>
        <div className="drawer-overlay" onClick={toggleMenu}></div>
        <div className="drawer-content">
          <div className="drawer-header">
            <span className="drawer-name">{userName || "Usuário"}</span>
            <div className="drawer-status-badge">
              <span
                className={`status-dot ${isOnline ? "online" : "offline"}`}
              ></span>
              <span className="drawer-role">Administrador</span>
            </div>
          </div>
          <div className="drawer-body">
            <button className="drawer-action-btn">
              <FaBell /> Notificações
            </button>
            <div className="drawer-spacer"></div>
            <button
              className="drawer-action-btn logout-action"
              onClick={onLogout}
            >
              <FaSignOutAlt /> Sair do Sistema
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;