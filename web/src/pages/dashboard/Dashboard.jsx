import React, { useState, useRef, useEffect } from "react";
import Header from "../../components/header/Header.jsx";
import { useAuth } from "../../hooks/useAuth.jsx";
import { useUser } from "../../hooks/useUser.jsx";
import { useChat } from "../../hooks/useChat.jsx";
import ConversationItem from "../../components/chat/conversationItem/ConversationItem.jsx";
import ChatWindow from "../../components/chat/chatWindow/ChatWindow.jsx";
import "./Dashboard.css";

// Ícones simples (você pode substituir por Lucide-react ou FontAwesome depois)
const IconChat = () => <span>💬</span>;
const IconQueue = () => <span>📥</span>;

const SOUNDS = {
  NEW_CHAT: "https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3",
  NEW_MESSAGE:
    "https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3",
};

const Dashboard = () => {
  const { uid } = useAuth();
  const { userData } = useUser(uid);
  const chat = useChat(userData ?? null);

  const [selectedChat, setSelectedChat] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("chats"); // 'chats' ou 'queue'

  const audioNewChat = useRef(new Audio(SOUNDS.NEW_CHAT));
  const audioNewMessage = useRef(new Audio(SOUNDS.NEW_MESSAGE));
  const knownChats = useRef(new Set());
  const lastMessagePerChat = useRef({});
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (isInitialLoad.current && chat.conversations.length > 0) {
      chat.conversations.forEach((conv) => {
        knownChats.current.add(conv.id);
        lastMessagePerChat.current[conv.id] = conv.updatedAt?.seconds;
      });
      isInitialLoad.current = false;
      return;
    }

    chat.conversations.forEach((conv) => {
      const lastMsgKey = conv.updatedAt?.seconds;
      const isSelected = selectedChat?.id === conv.id;

      if (!knownChats.current.has(conv.id)) {
        knownChats.current.add(conv.id);
        audioNewChat.current.play().catch(() => {});
        lastMessagePerChat.current[conv.id] = lastMsgKey;
        return;
      }

      if (lastMessagePerChat.current[conv.id] !== lastMsgKey && !isSelected) {
        audioNewMessage.current.play().catch(() => {});
      }
      lastMessagePerChat.current[conv.id] = lastMsgKey;
    });
  }, [chat.conversations, selectedChat]);

  if (!userData) {
    return <div className="loading-screen">Carregando dados do usuário...</div>;
  }

  return (
    <div className="dashboard-wrapper">
      <Header
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        userName={userData.name}
      />

      <div className="dashboard-main">
        {/* NOVA BARRA DE NAVEGAÇÃO LATERAL (ÍCONES) */}
        <nav className="nav-sidebar">
          <button
            className={`nav-item ${activeTab === "chats" ? "active" : ""}`}
            onClick={() => setActiveTab("chats")}
            title="Conversas Ativas"
          >
            <IconChat />
          </button>
          <button
            className={`nav-item ${activeTab === "queue" ? "active" : ""}`}
            onClick={() => setActiveTab("queue")}
            title="Aguardando Atendimento"
          >
            <IconQueue />
          </button>
        </nav>

        <aside className="sidebar-section">
          <div className="sidebar-controls">
            <h3>{activeTab === "chats" ? "Conversas" : "Fila de Espera"}</h3>
            <span className="badge">
              {activeTab === "chats" ? chat.conversations.length : 0} Ativas
            </span>
          </div>

          <div className="list-container">
            {activeTab === "chats" ? (
              chat.conversations.map((c) => (
                <ConversationItem
                  key={c.id}
                  chat={{
                    ...c,
                    name: c.brideName || c.phone,
                    lastMsg: c.lastMessage,
                    lastTime: c.updatedAt?.toDate().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                  }}
                  active={selectedChat?.id === c.id}
                  onClick={setSelectedChat}
                />
              ))
            ) : (
              <div className="empty-state">
                <p>Nenhum atendimento pendente na fila.</p>
              </div>
            )}
          </div>
        </aside>

        <section className="chat-section">
          <ChatWindow
            chat={selectedChat}
            user={userData}
            messages={chat.messages}
            getMessages={chat.getMessages}
            sendMessage={chat.sendMessage}
          />
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
