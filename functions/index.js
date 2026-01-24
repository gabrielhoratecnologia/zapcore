const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();
const db = admin.firestore();

setGlobalOptions({ region: "southamerica-east1" });

const UAZAPI_BASE_URL = "https://zapcore.uazapi.com";
const INSTANCE_TOKEN = "a7a49f16-1b09-4c8b-9215-587866361757";

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
