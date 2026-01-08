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
} from "firebase/firestore";

export const useChat = (user) => {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingError, setSendingError] = useState(null); // Estado para capturar erros

  // 1. Buscar Conversas
  useEffect(() => {
    if (!user || (!user.id && !user.uid)) {
      setConversations([]);
      setLoading(true);
      return;
    }

    let q;
    const convRef = collection(db, "conversations");

    try {
      if (user.role === "admin") {
        q = query(
          convRef,
          where("tenantId", "==", user.tenantId),
          orderBy("updatedAt", "desc")
        );
      } else {
        q = query(
          convRef,
          where("tenantId", "==", user.tenantId),
          where("assignedTo", "==", user.uid || user.id),
          orderBy("updatedAt", "desc")
        );
      }

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setConversations(data);
          setLoading(false);
        },
        (error) => {
          console.error("Erro ao buscar conversas:", error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error("Falha ao construir a query:", err);
      setLoading(false);
    }
  }, [user]);

  // 2. Buscar Mensagens
  const getMessages = useCallback(
    (conversationId) => {
      if (!conversationId || !user?.tenantId) return;

      const q = query(
        collection(db, "messages"),
        where("tenantId", "==", user.tenantId),
        where("conversationId", "==", conversationId),
        orderBy("createdAt", "asc")
      );

      return onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setMessages(data);
        },
        (error) => {
          console.error("Erro ao buscar mensagens:", error);
        }
      );
    },
    [user?.tenantId]
  );

  // 3. Enviar Mensagem
  const sendMessage = async (conversationId, text) => {
    if (!text.trim() || !user) return;

    setSendingError(null); // Limpa erro antes de tentar enviar
    const currentUserId = user.uid || user.id;

    if (!currentUserId) {
      setSendingError("Sessão do usuário inválida.");
      return;
    }

    try {
      const messageData = {
        conversationId: conversationId,
        text: text,
        type: "text",
        from: "agent",
        userId: currentUserId,
        tenantId: user.tenantId || "default",
        createdAt: serverTimestamp(),
        media: null,
      };

      await addDoc(collection(db, "messages"), messageData);

      const convRef = doc(db, "conversations", conversationId);
      await updateDoc(convRef, {
        lastMessage: text,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      setSendingError("Falha ao enviar mensagem. Verifique sua conexão.");
    }
  };

  return {
    conversations,
    messages,
    getMessages,
    sendMessage,
    loading,
    sendingError,
  };
};
