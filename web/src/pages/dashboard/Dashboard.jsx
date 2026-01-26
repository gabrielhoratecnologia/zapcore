import React, { useState, useRef, useEffect, useMemo } from "react";
import Header from "../../components/header/Header.jsx";
import { useAuth } from "../../hooks/useAuth.jsx";
import { useUser } from "../../hooks/useUser.jsx";
import { useChat } from "../../hooks/useChat.jsx";
import ConversationItem from "../../components/chat/conversationItem/ConversationItem.jsx";
import ChatWindow from "../../components/chat/chatWindow/ChatWindow.jsx";
import "./Dashboard.css";

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
  const [activeTab, setActiveTab] = useState("queue");

  // Filtros de conversas
  const myConversations = useMemo(() => {
    return chat.conversations.filter((c) => c.assignedTo === uid);
  }, [chat.conversations, uid]);

  const conversationsInQueue = useMemo(() => {
    return chat.conversations.filter((c) => !c.assignedTo);
  }, [chat.conversations]);

  // Filtragem por busca
  const filterBySearch = (list) => {
    if (!searchTerm) return list;
    return list.filter((c) => {
      const name = (c.brideName || c.phone || "Cliente").toLowerCase();
      return name.includes(searchTerm.toLowerCase());
    });
  };

  const currentList = filterBySearch(
    activeTab === "chats" ? myConversations : conversationsInQueue
  );

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

  currentList.map((c) => {
    console.log(c.phone)
  })

  return (
    <div className="dashboard-wrapper">
      <Header userName={userData.name} userId={uid} />

      <div className="dashboard-main">
        <aside className="sidebar-section">
          <div className="sidebar-header-container">
            <div className="tabs-container">
              <button
                className={`tab-btn ${activeTab === "queue" ? "active" : ""}`}
                onClick={() => setActiveTab("queue")}
              >
                NOVOS
                {conversationsInQueue.length > 0 && (
                  <span className="tab-badge green">
                    {conversationsInQueue.length}
                  </span>
                )}
              </button>
              <button
                className={`tab-btn ${activeTab === "chats" ? "active" : ""}`}
                onClick={() => setActiveTab("chats")}
              >
                MEUS
                {myConversations.length > 0 && (
                  <span className="tab-badge gray">
                    {myConversations.length}
                  </span>
                )}
              </button>
            </div>

            <div className="search-container">
              <input
                type="text"
                placeholder="Buscar atendimento"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
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
                    
                  }
                }
                  active={selectedChat?.id === c.id}
                  onClick={setSelectedChat}
                  onAccept={chat.assignConversation}
                />
              ))
            ) : (
              <div className="empty-state">
                <p>
                  {activeTab === "chats"
                    ? "Nenhum atendimento ativo."
                    : "Nenhum atendimento na fila."}
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
