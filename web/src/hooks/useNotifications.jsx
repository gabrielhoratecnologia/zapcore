import { useState, useEffect } from "react";
import { db } from "../firebase.js"; // Ajuste o caminho
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  orderBy,
  limit,
} from "firebase/firestore";

export const useNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setLoading(true);
      return;
    }

    const notifRef = collection(db, "users", userId, "notifications");
    const q = query(notifRef, orderBy("createdAt", "desc"), limit(20));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotifications(notifData);
        setLoading(false);
      },
      (error) => {
        console.error("Erro no hook useNotifications:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const markAsRead = async (notifId) => {
    if (!userId) return;
    try {
      const docRef = doc(db, "users", userId, "notifications", notifId);
      await updateDoc(docRef, { read: true });
    } catch (error) {
      console.error("Erro ao marcar como lida:", error);
    }
  };

  const hasUnread = notifications.some((n) => !n.read);

  return { notifications, hasUnread, markAsRead, loading };
};
