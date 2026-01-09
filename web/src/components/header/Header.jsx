import React, { useState, useRef, useEffect } from "react";
import { FaSignOutAlt, FaBell, FaBars, FaTimes } from "react-icons/fa";
import NotificationDropdown from "../../components/notificationDropDown/NotificationDropdown.jsx";
import "./Header.css";

const Header = ({ userName, onLogout }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // MOCK DE DADOS: No futuro, isso virá do Firebase
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Atenção",
      message: "Cuidado com a quantidade de vezes que você reativa um template. Tem clientes que valem a pena, outros nem tanto.",
      read: false,
      time: "5m atrás",
    },
    {
      id: 2,
      title: "Sistema",
      message: "Manutenção programada para as 22h.",
      read: false,
      time: "1h atrás",
    },
    {
      id: 3,
      title: "Atualização",
      message: "Versão 2.0 liberada.",
      read: true,
      time: "2h atrás",
    },
  ]);

  const hasUnread = notifications.some((n) => !n.read);
  const dropdownRef = useRef(null);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const toggleNotifications = () => {
    setIsNotifOpen(!isNotifOpen);
  };

  const markAsRead = (id) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="main-header">
      <div className="header-container">
        <div className="header-left">
          <div className="logo-container">
            <span className="logo-brand">Seravalli</span>
            <span className="logo-subtext">Atendimento</span>
          </div>
        </div>

        <div className="header-center"></div>

        <div className="header-right desktop-only">
          <div className="notification-wrapper" ref={dropdownRef}>
            <button
              className={`icon-button ${isNotifOpen ? "active" : ""}`}
              onClick={toggleNotifications}
              aria-label="Notificações"
            >
              <FaBell size={18} />
              {hasUnread && <span className="notification-badge"></span>}
            </button>

            {isNotifOpen && (
              <NotificationDropdown
                notifications={notifications}
                onMarkRead={markAsRead}
                onClose={() => setIsNotifOpen(false)}
              />
            )}
          </div>

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
            {/* No mobile, simplificamos ou abrimos um modal de notificações */}
            <button className="drawer-action-btn">
              <FaBell /> Notificações {hasUnread && "(Novo)"}
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
