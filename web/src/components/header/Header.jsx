import React, { useState, useRef, useEffect } from "react";
import { FaSignOutAlt, FaBell, FaBars, FaTimes } from "react-icons/fa";
import { useNotifications } from "../../hooks/useNotifications"; // Importe o hook
import NotificationDropdown from "../notificationDropDown/NotificationDropdown.jsx";
import "./Header.css";

const Header = ({ userId, userName, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const dropdownRef = useRef(null);

  const { notifications, hasUnread, markAsRead, loading } =
    useNotifications(userId);
    
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
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              aria-label="Notificações"
            >
              <FaBell size={18} />
              {hasUnread && <span className="notification-badge"></span>}
            </button>

            {isNotifOpen && (
              <NotificationDropdown
                notifications={notifications}
                onMarkRead={markAsRead}
              />
            )}
          </div>

          <div className="divider"></div>

          <div className="user-profile">
            <div className="user-info">
              <span className="user-name">{userName || "Usuário"}</span>
              <div className="status-row">
                <span className="user-role">Administrador</span>
                <span className="status-dot online"></span>
              </div>
            </div>
            <button onClick={onLogout} className="logout-btn" title="Sair">
              <FaSignOutAlt size={18} />
            </button>
          </div>
        </div>

        <button
          className="mobile-menu-btn"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
      </div>

      {/* MOBILE DRAWER */}
      <div className={`mobile-drawer ${isMenuOpen ? "open" : ""}`}>
        <div
          className="drawer-overlay"
          onClick={() => setIsMenuOpen(false)}
        ></div>
        <div className="drawer-content">
          <div className="drawer-header">
            <span className="drawer-name">{userName || "Usuário"}</span>
            <div className="drawer-status-badge">
              <span className="status-dot online"></span>
              <span className="drawer-role">Administrador</span>
            </div>
          </div>
          <div className="drawer-body">
            <button className="drawer-action-btn">
              <FaBell /> Notificações{" "}
              {hasUnread && <span className="mobile-badge-text">(Novas)</span>}
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
