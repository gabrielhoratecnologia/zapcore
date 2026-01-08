import React, { useState } from "react";
import Header from "../../components/header/Header.jsx";
import ConversationItem from "../../components/chat/conversationItem/ConversationItem.jsx";
import ChatWindow from "../../components/chat/chatWindow/ChatWindow.jsx";
import "./Dashboard.css";

const MOCK_DATA = [
  {
    id: 1,
    name: "Gustavo",
    avatar: "https://i.pravatar.cc/150?u=1",
    lastMsg: "Vlw!",
    lastTime: "09:58",
    messages: [
      { text: "Tu foi lá?", time: "21:08", sentByMe: false },
      { text: "Fui nada kkkk", time: "21:09", sentByMe: true },
      { text: "meu capacete ta ai", time: "09:58", sentByMe: false },
      { text: "Vlw!", time: "09:58", sentByMe: true },
    ],
  },
  {
    id: 2,
    name: "Anotações",
    avatar: "https://i.pravatar.cc/150?u=2",
    lastMsg: "Lembrar de enviar o contrato",
    lastTime: "Ontem",
    messages: [
      { text: "Lembrar de enviar o contrato", time: "10:00", sentByMe: true },
    ],
  },
];

const Dashboard = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="dashboard-wrapper">
      <Header searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      <div className="dashboard-main">
        <aside className="sidebar-section">
          <div className="sidebar-controls">
            <h3>Conversas</h3>
          </div>
          <div className="list-container">
            {MOCK_DATA.map((chat) => (
              <ConversationItem
                key={chat.id}
                chat={chat}
                active={selectedChat?.id === chat.id}
                onClick={setSelectedChat}
              />
            ))}
          </div>
        </aside>

        <section className="chat-section">
          <ChatWindow chat={selectedChat} />
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
