import React, { useState } from "react";
import { FaSignOutAlt, FaBell, FaSearch, FaPowerOff } from "react-icons/fa";
import "./Header.css";

const Header = ({ userName, onLogout, searchTerm, setSearchTerm }) => {
  const [isOnline, setIsOnline] = useState(true);

  return (
    <header className="main-header">
      {/* Esquerda: Logo (Mantido conforme aprovado) */}
      <div className="header-left">
        <div className="logo-container">
          <span className="logo-brand">Seravalli</span>
          <span className="logo-subtext">Atendimento</span>
        </div>
      </div>

      {/* Centro: Busca (Mantido conforme aprovado) */}
      <div className="header-center">
        <div className="search-container">
          <FaSearch className="search-icon" size={16} />
          <input
            type="text"
            placeholder="Buscar noiva, número ou data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Direita: Ações e Perfil Ajustados */}
      <div className="header-right">
        {/* Botão de Status (Novo) */}
        <button
          className={`status-toggle-btn ${
            isOnline ? "is-online" : "is-offline"
          }`}
          onClick={() => setIsOnline(!isOnline)}
        >
          <FaPowerOff size={12} />
          {isOnline ? "ONLINE" : "OFFLINE"}
        </button>

        <button className="icon-button notification-btn">
          <FaBell size={20} />
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
            <FaSignOutAlt size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
