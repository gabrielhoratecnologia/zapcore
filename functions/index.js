const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors");
const corsHandler = cors({ origin: true });

admin.initializeApp();
const db = admin.firestore();

setGlobalOptions({ region: "southamerica-east1" });

const UAZAPI_BASE_URL = "https://zapcore.uazapi.com";
const INSTANCE_TOKEN = "a7a49f16-1b09-4c8b-9215-587866361757";

/**
 * =========================================
 * 1️⃣ ENVIO: Firestore -> WhatsApp (AGENTE)
 * =========================================
 */
exports.onMessageCreated = onDocumentCreated(
  {
    document: "messages/{messageId}",
    region: "southamerica-east1",
    invoker: "public",
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const msg = snap.data();

    if (msg.uazapiResponse) return;

    if (msg.from !== "agent") return;

    if (msg.source === "uazapi-refresh") {
      console.log("Ignorando mensagem de refresh:", snap.id);
      return;
    }

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
        },
      );

      await snap.ref.update({
        status: "sent",
        uazapiResponse: data,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error("Erro ao enviar WhatsApp:", error?.response?.data || error);

      await snap.ref.update({
        status: "error",
        errorMessage: error.message || "Erro ao enviar",
      });
    }
  },
);

/**
 * =========================================
 * 2️⃣ RECEBIMENTO: WhatsApp -> Firestore
 * =========================================
 */
exports.uazapiWebhook = onRequest(async (req, res) => {
  try {
    const TENANT_ID = "zapcore-dev";
    const data = req.body;
    const message = data?.message;
    const chat = data?.chat;

    if (!message || !chat) {
      return res.status(200).send("ignored-invalid-payload");
    }

    const phone = chat.phone.replace(/\D/g, "");
    if (!phone) return res.status(200).send("ignored-invalid-phone");

    if (message.wasSentByApi === true)
      return res.status(200).send("ignored-api");
    if (message.isGroup === true || chat.wa_isGroup === true)
      return res.status(200).send("ignored-group");

    const text = message.text || message.content || "";
    const senderPhoto = chat.imagePreview || chat.image || null;
    const senderName = message.senderName || null;

    const messageId = message.id || `fallback_${phone}_${Date.now()}`;

    const convId = `${TENANT_ID}_${phone}`;
    const convRef = db.collection("conversations").doc(convId);
    const convSnap = await convRef.get();

    if (convSnap.exists) {
      await convRef.update({
        lastMessage: text || "[mídia]",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      await convRef.set({
        id: convId,
        phone,
        tenantId: TENANT_ID,
        status: "open",
        assignedByName: senderName || null,
        assignedTo: null,
        lastMessage: text || "[mídia]",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        photo: senderPhoto || null,
      });
    }

    await db
      .collection("messages")
      .doc(messageId)
      .set({
        conversationId: convId,
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

/**
 * =========================================
 * 3️⃣ REFRESH MANUAL DA CONVERSA
 * =========================================
 */
exports.refreshConversation = onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const TENANT_ID = "zapcore-dev";
      const phone = req.query.phone;

      if (!phone) {
        return res.status(400).send("phone-required");
      }

      const conversationId = `${TENANT_ID}_${phone}`;

      const result = await refreshChat({
        conversationId,
        phone,
        limit: 10,
      });

      return res.status(200).json({
        ok: true,
        ...result,
      });
    } catch (err) {
      console.error("Erro refresh chat:", err);
      return res.status(500).send("error");
    }
  });
});

/**
 * =========================================
 * 4️⃣ FUNÇÃO INTERNA refreshChat (NO INDEX)
 * =========================================
 */
async function refreshChat({ conversationId, phone, limit = 10 }) {
  const chatid = `${phone}@s.whatsapp.net`;

  const { data } = await axios.post(
    `${UAZAPI_BASE_URL}/message/find`,
    {
      chatid,
      limit,
      offset: 0,
    },
    {
      headers: {
        token: INSTANCE_TOKEN,
        "Content-Type": "application/json",
      },
    },
  );

  const messages = data?.messages || [];
  let saved = 0;

  for (const msg of messages) {
    if (!msg.id) continue;

    const messageRef = db.collection("messages").doc(msg.id);

    const exists = await messageRef.get();
    if (exists.exists) continue;

    const from = msg.fromMe ? "agent" : "client";
    const text = msg.text || msg.content?.text || msg.content?.caption || "";

    await messageRef.set({
      conversationId,
      tenantId: conversationId.split("_")[0],
      from,
      phone,
      text,
      type: msg.messageType || "text",
      senderName: msg.senderName || null,
      senderPhoto: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      timestamp: msg.messageTimestamp
        ? new Date(msg.messageTimestamp)
        : admin.firestore.FieldValue.serverTimestamp(),
      source: "uazapi-refresh",
    });

    saved++;
  }

  return {
    saved,
    returned: messages.length,
  };
}
