import React, { useState, useEffect } from "react";
import Header from "../../components/header/Header.jsx";
import { useLogout } from "../../hooks/useLogout.jsx";
import "./Dashboard.css";

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [userName, setUserName] = useState("Admin");
  const { logout } = useLogout();

  return (
    <div className="dashboard-container">
      {/* Header Fixo */}
      <Header
        userName={userName}
        onLogout={logout}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      <div className="dashboard-content">
        {/* Sidebar: Lista de Noivas/Conversas */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <h3>Conversas</h3>
            <span className="badge">12 Ativas</span>
          </div>
          <div className="conversation-list">
            {/* Aqui entrará o seu Map das conversas do Firestore */}
            <p className="empty-msg">Aguardando dados...</p>
          </div>
        </aside>

        {/* Área Principal: Visualização das Mensagens (Read-only) */}
        <main className="chat-view">
          <div className="chat-placeholder">
            <h2>Selecione uma conversa</h2>
            <p>Filtre por nome da noiva ou data do evento na barra superior.</p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
