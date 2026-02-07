const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();
const db = admin.firestore();

setGlobalOptions({ region: "southamerica-east1" });

const UAZAPI_BASE_URL = "https://zapcore.uazapi.com";
const INSTANCE_TOKEN = "a7a49f16-1b09-4c8b-9215-587866361757";
const TENANT_ID = "zapcore-dev";

/**
 * =========================================
 * 1️⃣ ENVIO: Firestore -> WhatsApp (AGENTE)
 * =========================================
 */
exports.onMessageCreated = onDocumentCreated(
  {
    document: "messages/{messageId}",
    invoker: "public",
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const msg = snap.data();

    // só mensagens do agente
    if (msg.from !== "agent") return;

    // evita loop
    if (msg.uazapiResponse) return;

    try {
      const convRef = db.collection("conversations").doc(msg.conversationId);
      const convSnap = await convRef.get();
      if (!convSnap.exists) return;

      const { phone } = convSnap.data();

      const { data } = await axios.post(
        `${UAZAPI_BASE_URL}/send/text`,
        {
          number: phone,
          text: msg.text,
          linkPreview: false,
          async: true,
        },
        {
          headers: {
            token: INSTANCE_TOKEN,
            "Content-Type": "application/json",
          },
        }
      );

      await snap.ref.update({
        status: "sent",
        uazapiResponse: data,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (err) {
      console.error("Erro envio WhatsApp:", err?.response?.data || err);

      await snap.ref.update({
        status: "error",
        errorMessage: err.message || "Erro ao enviar",
      });
    }
  }
);

/**
 * =========================================
 * 2️⃣ RECEBIMENTO: WhatsApp -> Firestore
 * =========================================
 */
exports.uazapiWebhook = onRequest(async (req, res) => {
  try {
    const data = req.body;
    const message = data?.message;
    const chat = data?.chat;

    if (!message || !chat) {
      return res.status(200).send("ignored-invalid-payload");
    }

    // ignora mensagens enviadas pela API
    if (message.wasSentByApi === true) {
      return res.status(200).send("ignored-api");
    }

    // ignora grupos
    if (message.isGroup === true || chat.wa_isGroup === true) {
      return res.status(200).send("ignored-group");
    }

    const phone = chat.phone?.replace(/\D/g, "");
    if (!phone) {
      return res.status(200).send("ignored-invalid-phone");
    }

    const text = message.text || message.content || "";
    const senderName = message.senderName || null;
    const senderPhoto = chat.imagePreview || chat.image || null;

    const conversationId = `${TENANT_ID}_${phone}`;
    const convRef = db.collection("conversations").doc(conversationId);
    const convSnap = await convRef.get();

    if (!convSnap.exists) {
      await convRef.set({
        id: conversationId,
        phone,
        tenantId: TENANT_ID,
        status: "open",
        assignedTo: null,
        lastMessage: text || "[mídia]",
        photo: senderPhoto,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      await convRef.update({
        lastMessage: text || "[mídia]",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    const messageId = message.id || `${phone}_${Date.now()}`;

    await db.collection("messages").doc(messageId).set({
      conversationId,
      tenantId: TENANT_ID,
      from: "client",
      phone,
      text,
      type: message.type || "text",
      senderName,
      senderPhoto,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      timestamp: message.messageTimestamp
        ? new Date(message.messageTimestamp)
        : admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).send("ok");
  } catch (err) {
    console.error("Erro webhook uazapi:", err);
    return res.status(500).send("error");
  }
});
