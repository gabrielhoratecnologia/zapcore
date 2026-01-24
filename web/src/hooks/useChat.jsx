import { useState, useEffect, useCallback } from "react";
import { db } from "../firebase.js";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  orderBy,
  doc,
  updateDoc,
  or,
} from "firebase/firestore";

export const useChat = (user) => {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingError, setSendingError] = useState(null);

  // 1️⃣ Buscar Conversas
  useEffect(() => {
    if (!user || (!user.id && !user.uid)) {
      setConversations([]);
      setLoading(true);
      return;
    }

    let q;
    const convRef = collection(db, "conversations");
    const currentUserId = user.uid || user.id;

    try {
      if (user.role === "admin") {
        q = query(
          convRef,
          where("tenantId", "==", user.tenantId),
          orderBy("updatedAt", "desc"),
        );
      } else {
        q = query(
          convRef,
          where("tenantId", "==", user.tenantId),
          or(
            where("assignedTo", "==", currentUserId),
            where("assignedTo", "==", null),
          ),
          orderBy("updatedAt", "desc"),
        );
      }

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setConversations(data);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error("Erro ao buscar conversas:", err);
      setLoading(false);
    }
  }, [user]);

  // 2️⃣ Buscar Mensagens
  const getMessages = useCallback(
    (conversationId) => {
      if (!conversationId || !user?.tenantId) return;

      const q = query(
        collection(db, "messages"),
        where("tenantId", "==", user.tenantId),
        where("conversationId", "==", conversationId),
        orderBy("createdAt", "asc"),
      );

      return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(data);
      });
    },
    [user?.tenantId],
  );

  // 3️⃣ Enviar Mensagem (SÓ FIRESTORE)
  const sendMessage = async (conversation, text) => {
    if (!text.trim() || !user) return;

    setSendingError(null);
    const currentUserId = user.uid || user.id;

    try {
      const messageData = {
        conversationId: conversation.id,
        phone: conversation.phone, // 🔥 ESSENCIAL
        text,
        type: "text",
        from: "agent",
        userId: currentUserId,
        tenantId: user.tenantId,
        createdAt: serverTimestamp(),
        media: null,
        status: "sending",
      };

      await addDoc(collection(db, "messages"), messageData);

      const convRef = doc(db, "conversations", conversation.id);
      await updateDoc(convRef, {
        lastMessage: text,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      setSendingError("Falha ao enviar mensagem.");
    }
  };

  // 4️⃣ Assumir Atendimento
  const assignConversation = async (conversationId) => {
    const currentUserId = user.uid || user.id;

    try {
      const convRef = doc(db, "conversations", conversationId);
      await updateDoc(convRef, {
        assignedTo: currentUserId,
        updatedAt: serverTimestamp(),
        assignedByName: user.name || "Agente",
      });
    } catch (error) {
      console.error("Erro ao assumir atendimento:", error);
      throw error;
    }
  };

  return {
    conversations,
    messages,
    getMessages,
    sendMessage,
    assignConversation,
    loading,
    sendingError,
  };
};
