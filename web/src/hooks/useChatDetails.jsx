import { useState, useEffect } from "react";
import { db } from "../firebase.js"; // Ajuste o caminho conforme seu projeto
import {
  doc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  Timestamp,
} from "firebase/firestore";

export const useChatDetails = (chatId) => {
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState({
    brideName: "",
    weddingDate: "",
    notes: [],
  });

  useEffect(() => {
    if (!chatId) return;

    // Listener em tempo real para os detalhes da conversa
    const unsub = onSnapshot(doc(db, "conversations", chatId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDetails({
          brideName: data.brideName || "",
          weddingDate: data.weddingDate || "",
          notes: data.notes || [],
        });
      }
    });

    return () => unsub();
  }, [chatId]);

  const updateGeneralDetails = async (brideName, weddingDate) => {
    if (!chatId) return;
    setLoading(true);
    try {
      const chatRef = doc(db, "conversations", chatId);
      await updateDoc(chatRef, {
        brideName: brideName,
        weddingDate: weddingDate,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Erro ao atualizar detalhes:", error);
    } finally {
      setLoading(false);
    }
  };

  const addNote = async (text) => {
    if (!chatId || !text.trim()) return;
    try {
      const chatRef = doc(db, "conversations", chatId);
      const newNote = {
        id: Date.now(),
        text: text,
        createdAt: new Date().toLocaleString("pt-BR"),
      };

      await updateDoc(chatRef, {
        notes: arrayUnion(newNote),
      });
    } catch (error) {
      console.error("Erro ao adicionar nota:", error);
    }
  };

  return { details, updateGeneralDetails, addNote, loading };
};
