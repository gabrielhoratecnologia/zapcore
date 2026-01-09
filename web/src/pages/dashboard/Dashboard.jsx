import React, { useState, useRef, useEffect, useMemo } from "react";
import Header from "../../components/header/Header.jsx";
import { useAuth } from "../../hooks/useAuth.jsx";
import { useUser } from "../../hooks/useUser.jsx";
import { useChat } from "../../hooks/useChat.jsx";
import ConversationItem from "../../components/chat/conversationItem/ConversationItem.jsx";
import ChatWindow from "../../components/chat/chatWindow/ChatWindow.jsx";
import "./Dashboard.css";

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
  const [activeTab, setActiveTab] = useState("chats"); // 'chats' (meus) ou 'queue' (abertos)

  // Filtros de conversas
  const myConversations = useMemo(() => {
    return chat.conversations.filter((c) => c.assignedTo === uid);
  }, [chat.conversations, uid]);

  const conversationsInQueue = useMemo(() => {
    return chat.conversations.filter((c) => !c.assignedTo);
  }, [chat.conversations]);

  // Lógica de Áudio e Notificações
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

  // Define qual lista renderizar
  const currentList =
    activeTab === "chats" ? myConversations : conversationsInQueue;

  return (
    <div className="dashboard-wrapper">
      <Header
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        userName={userData.name}
      />

      <div className="dashboard-main">
        <nav className="nav-sidebar">
          <button
            className={`nav-item ${activeTab === "chats" ? "active" : ""}`}
            onClick={() => setActiveTab("chats")}
            title="Meus Atendimentos"
          >
            <IconChat />
            {myConversations.length > 0 && <span className="dot-notify" />}
          </button>
          <button
            className={`nav-item ${activeTab === "queue" ? "active" : ""}`}
            onClick={() => setActiveTab("queue")}
            title="Fila de Espera (Abertos)"
          >
            <IconQueue />
            {conversationsInQueue.length > 0 && (
              <span className="dot-notify orange" />
            )}
          </button>
        </nav>

        <aside className="sidebar-section">
          <div className="sidebar-controls">
            <h3>{activeTab === "chats" ? "Meus Chats" : "Aguardando"}</h3>
            <span className="badge">
              {currentList.length}{" "}
              {activeTab === "chats" ? "Ativos" : "Na Fila"}
            </span>
          </div>

          <div className="list-container">
            {currentList.length > 0 ? (
              currentList.map((c) => (
                <ConversationItem
                  key={c.id}
                  chat={{
                    ...c,
                    name: c.brideName || c.phone || "Cliente",
                    lastMsg: c.lastMessage,
                    lastTime: c.updatedAt?.toDate().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                  }}
                  active={selectedChat?.id === c.id}
                  onClick={setSelectedChat}
                  onAccept={chat.assignConversation}
                />
              ))
            ) : (
              <div className="empty-state">
                <p>
                  {activeTab === "chats"
                    ? "Você não possui atendimentos ativos."
                    : "Nenhum atendimento pendente na fila."}
                </p>
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
