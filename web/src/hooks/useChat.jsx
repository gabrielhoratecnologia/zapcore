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
  getDocs,
  endBefore,
  limitToLast,
} from "firebase/firestore";

export const useChat = (user) => {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingError, setSendingError] = useState(null);
  const [oldestDoc, setOldestDoc] = useState(null);
  const [realtimeUnsub, setRealtimeUnsub] = useState(null);
  const [lastTimestamp, setLastTimestamp] = useState(null);
  const [messagesCache, setMessagesCache] = useState({});

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

  const loadLastMessages = useCallback(
    async (conversationId) => {
      if (!conversationId || !user?.tenantId) return;

      if (realtimeUnsub) {
        realtimeUnsub();
        setRealtimeUnsub(null);
      }

      if (messagesCache[conversationId]) {
        const cached = messagesCache[conversationId];
        setMessages(cached);
        setOldestDoc(cached[0]?._docRef || null);
        console.log("CACHED OLDEST:", cached[0]?.id);
        return;
      }

      const q = query(
        collection(db, "messages"),
        where("tenantId", "==", user.tenantId),
        where("conversationId", "==", conversationId),
        orderBy("timestamp", "asc"),
        orderBy("__name__", "asc"),
        limitToLast(30),
      );

      const snap = await getDocs(q);

      console.log(
        "SNAP IDS (LAST):",
        snap.docs.map((d) => d.id),
      );

      const msgs = snap.docs.map((d) => ({
        id: d.id,
        _docRef: d,
        ...d.data(),
      }));

      const last = msgs[msgs.length - 1];
      setLastTimestamp(last?.timestamp || null);

      setMessages(msgs);

      // 🔥 use SEMPRE do snap
      setOldestDoc(snap.docs[0] || null);
      console.log("NOVO OLDEST (LAST):", snap.docs[0]?.id);

      setMessagesCache((prev) => ({
        ...prev,
        [conversationId]: msgs,
      }));
    },
    [user?.tenantId, realtimeUnsub, messagesCache],
  );

  const listenNewMessages = useCallback(
    (conversationId) => {
      if (!conversationId || !user?.tenantId || !lastTimestamp) return;

      const q = query(
        collection(db, "messages"),
        where("tenantId", "==", user.tenantId),
        where("conversationId", "==", conversationId),
        where("timestamp", ">", lastTimestamp),
        orderBy("timestamp", "asc"),
        orderBy("__name__", "asc"),
      );

      const unsub = onSnapshot(q, (snap) => {
        const added = snap
          .docChanges()
          .filter((c) => c.type === "added")
          .map((c) => ({ id: c.doc.id, ...c.doc.data() }));

        if (added.length) {
          setMessages((prev) => {
            const ids = new Set(prev.map((m) => m.id));
            const filtered = added.filter((m) => !ids.has(m.id));
            return [...prev, ...filtered];
          });
          const last = added[added.length - 1];
          setLastTimestamp(last.timestamp);
        }
      });

      setRealtimeUnsub(() => unsub);
      return unsub;
    },
    [user?.tenantId, lastTimestamp],
  );

  const loadOlderMessages = useCallback(
    async (conversationId, containerRef) => {
      if (!oldestDoc || !conversationId || !user?.tenantId) {
        console.log("PAGINAÇÃO BLOQUEADA", {
          hasOldest: !!oldestDoc,
          conversationId,
        });
        return;
      }

      console.log("LOAD OLDER CURSOR:", oldestDoc.id);

      const container = containerRef?.current;
      const prevScrollHeight = container?.scrollHeight || 0;

      const q = query(
        collection(db, "messages"),
        where("tenantId", "==", user.tenantId),
        where("conversationId", "==", conversationId),
        orderBy("timestamp", "asc"),
        orderBy("__name__", "asc"),
        endBefore(oldestDoc), // 🔥 CURSOR REAL
        limitToLast(30),
      );

      const snap = await getDocs(q);

      console.log(
        "SNAP IDS (OLDER):",
        snap.docs.map((d) => d.id),
      );

      if (snap.empty) {
        console.log("SEM MAIS MENSAGENS ANTIGAS");
        return;
      }

      const older = snap.docs.map((d) => ({
        id: d.id,
        _docRef: d,
        ...d.data(),
      }));

      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const filteredOlder = older.filter((m) => !existingIds.has(m.id));

        const merged = [...filteredOlder, ...prev];

        setMessagesCache((cache) => ({
          ...cache,
          [conversationId]: merged,
        }));

        return merged;
      });

      setOldestDoc(snap.docs[0] || null);
      console.log("NOVO OLDEST (OLDER):", snap.docs[0]?.id);

      requestAnimationFrame(() => {
        if (!container) return;
        const newScrollHeight = container.scrollHeight;
        container.scrollTop = newScrollHeight - prevScrollHeight;
      });
    },
    [oldestDoc, user?.tenantId],
  );

  const sendMessage = async (conversation, text) => {
    if (!text.trim() || !user) return;

    setSendingError(null);
    const currentUserId = user.uid || user.id;

    try {
      const messageData = {
        conversationId: conversation.id,
        phone: conversation.phone,
        text,
        type: "text",
        from: "agent",
        userId: currentUserId,
        tenantId: user.tenantId,
        createdAt: serverTimestamp(),
        timestamp: serverTimestamp(),
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
    loadLastMessages,
    listenNewMessages,
    loadOlderMessages,
    sendMessage,
    assignConversation,
    loading,
    sendingError,
  };
};
