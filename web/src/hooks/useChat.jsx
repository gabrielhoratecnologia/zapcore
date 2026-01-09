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

  // 1. Buscar Conversas (Fila + Atribuídos)
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
        // ADMIN: Vê absolutamente todas as conversas do tenant (com ou sem dono)
        q = query(
          convRef,
          where("tenantId", "==", user.tenantId),
          orderBy("updatedAt", "desc")
        );
      } else {
        // AGENTE: Vê o que é dele OU o que está na fila (assignedTo == null)
        q = query(
          convRef,
          where("tenantId", "==", user.tenantId),
          or(
            where("assignedTo", "==", currentUserId),
            where("assignedTo", "==", null)
          ),
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

  // 2. Buscar Mensagens de uma conversa específica
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

    setSendingError(null);
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

      // Adiciona a mensagem
      await addDoc(collection(db, "messages"), messageData);

      // Atualiza o status da conversa
      const convRef = doc(db, "conversations", conversationId);
      await updateDoc(convRef, {
        lastMessage: text,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      setSendingError("Falha ao enviar mensagem.");
    }
  };

  // 4. Assumir Atendimento (Fila ou de outro usuário)
  const assignConversation = async (conversationId) => {
    const currentUserId = user.uid || user.id;

    if (!conversationId || !currentUserId) {
      console.error("ID da conversa ou usuário ausente");
      return;
    }

    try {
      const convRef = doc(db, "conversations", conversationId);

      // Atualiza o responsável pelo atendimento
      await updateDoc(convRef, {
        assignedTo: currentUserId,
        updatedAt: serverTimestamp(),
        // Opcional: registrar quem foi o último a assumir
        assignedByName: user.name || "Agente",
      });

      console.log(`Conversa ${conversationId} assumida por ${currentUserId}`);
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
    assignConversation, // Exportado para uso no ConversationItem ou ChatWindow
    loading,
    sendingError,
  };
};
