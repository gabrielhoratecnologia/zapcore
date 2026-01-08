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

  // 1. Buscar Conversas (Respeitando a Role e Tenant)

  console.log(user);

  useEffect(() => {
    if (!user || !user.id) {
      setConversations([]);
      setLoading(true);
      console.log("carregando useChat");
      return;
    }

    let q;
    const convRef = collection(db, "conversations");

    try {
      if (user.role === "admin") {
        // Admin: Vê tudo do seu tenantId
        q = query(
          convRef,
          where("tenantId", "==", user.tenantId),
          orderBy("updatedAt", "desc")
        );
      } else {
        // Usuário comum: Vê apenas o que lhe foi atribuído
        q = query(
          convRef,
          where("tenantId", "==", user.tenantId),
          where("assignedTo", "==", user.uid),
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
          console.error(
            "Erro ao buscar conversas (Verifique os índices do Firestore):",
            error
          );
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error("Falha ao construir a query:", err);
      setLoading(false);
    }
  }, [user]); // Re-executa quando o userData é preenchido no Dashboard

  // 2. Buscar Mensagens de uma conversa específica (Real-time)
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
    [user?.tenantId] // dependência REAL
  );

  // 3. Enviar Mensagem para o Firestore
  const sendMessage = async (conversationId, text) => {
    if (!text.trim() || !user) return;

    try {
      const messageData = {
        conversationId,
        text,
        type: "text",
        from: user.role === "admin" ? "admin" : "user", // Identifica o remetente
        userId: user.uid,
        tenantId: user.tenantId,
        createdAt: serverTimestamp(),
        media: null,
      };

      // 3.1. Salva a nova mensagem
      await addDoc(collection(db, "messages"), messageData);

      // 3.2. Atualiza o resumo da conversa
      const convRef = doc(db, "conversations", conversationId);
      await updateDoc(convRef, {
        lastMessage: text,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    }
  };

  return { conversations, messages, getMessages, sendMessage, loading };
};
