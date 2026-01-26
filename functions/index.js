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

    // Só envia mensagens do agente
    if (msg.from !== "agent") return;

    try {
      // Busca conversa para pegar telefone
      const convRef = db.collection("conversations").doc(msg.conversationId);
      const convSnap = await convRef.get();

      if (!convSnap.exists) {
        console.error("Conversa não encontrada:", msg.conversationId);
        return;
      }

      const { phone } = convSnap.data();

      // Envia para Uazapi
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
            token: `${INSTANCE_TOKEN}`,
            "Content-Type": "application/json",
          },
        },
      );

      // Atualiza status
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
 * Webhook do UAZAPI
 * =========================================
 */
exports.uazapiWebhook = onRequest(
  { region: "southamerica-east1" },
  async (req, res) => {
    try {
      const TENANT_ID = "zapcore-dev";
      const data = req.body;
      const message = data?.message;
      const chat = data?.chat;

      if (!message || !chat) {
        return res.status(200).send("ignored-invalid-payload");
      }

      // Seta Telefone
      const phone = chat.phone.replace(/\D/g, '') || "Não localizado";
      if (!phone) return res.status(200).send("ignored-invalid-phone");

      // Seta Grupo ou mensagem enviada pela API
      const wasSentByApi = message.wasSentByApi === true;
      const isGroup = message.isGroup === true || chat.wa_isGroup === true;
      if (wasSentByApi) return res.status(200).send("ignored-api");
      if (isGroup) return res.status(200).send("ignored-group");

      // Seta Texto
      const text = message.text || message.content || "";

      // Seta Foto URL
      const senderPhoto = chat.imagePreview || chat.image || null;

      // Nome do CONTATO
      const senderName =
        message.senderName || null;

      //
      const messageId =
        message.id || `Erro Ao Trazer ID - ${phone}_${Date.now()}`;

      // Verifica se a conversa EXISTE
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
      
      // Salva Mensagem
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
  },
);