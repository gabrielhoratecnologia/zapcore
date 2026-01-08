import React, { useState } from "react";
import Header from "../../components/header/Header.jsx";
import { useAuth } from "../../hooks/useAuth.jsx";
import { useUser } from "../../hooks/useUser.jsx";
import { useChat } from "../../hooks/useChat.jsx";
import ConversationItem from "../../components/chat/conversationItem/ConversationItem.jsx";
import ChatWindow from "../../components/chat/chatWindow/ChatWindow.jsx";
import "./Dashboard.css";

const Dashboard = () => {
  const { uid } = useAuth();
  const { userData } = useUser(uid);

  const chat = useChat(userData ?? null);

  const [selectedChat, setSelectedChat] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  if (!userData) {
    return <div className="loading-screen">Carregando dados do usuário...</div>;
  }

  console.log(chat.messages)

  return (
    <div className="dashboard-wrapper">
      <Header
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        userName={userData.name}
      />

      <div className="dashboard-main">
        <aside className="sidebar-section">
          <div className="sidebar-controls">
            <h3>Conversas</h3>
            <span className="badge">{chat.conversations.length} Ativas</span>
          </div>

          <div className="list-container">
            {chat.conversations.map((chat) => (
              <ConversationItem
                key={chat.id}
                chat={{
                  ...chat,
                  name: chat.brideName || chat.phone,
                  lastMsg: chat.lastMessage,
                  lastTime: chat.updatedAt?.toDate().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                }}
                active={selectedChat?.id === chat.id}
                onClick={setSelectedChat}
              />
            ))}
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
