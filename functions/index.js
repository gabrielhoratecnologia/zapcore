const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

exports.whatsappWebhook = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).send("Only POST allowed");
    }

    /**
     * Payload esperado (simulando WhatsApp)
     */
    const {
      tenantId,
      phone,
      text
    } = req.body;

    if (!tenantId || !phone || !text) {
      return res.status(400).json({
        error: "tenantId, phone e text são obrigatórios",
      });
    }

    // 1️⃣ Procurar conversation existente
    const convoSnap = await db
      .collection("conversations")
      .where("tenantId", "==", tenantId)
      .where("phone", "==", phone)
      .limit(1)
      .get();

    let conversationRef;
    let conversationId;

    if (convoSnap.empty) {
      // 2️⃣ Criar nova conversation (assignedTo começa null)
      conversationRef = db.collection("conversations").doc();
      conversationId = conversationRef.id;

      await conversationRef.set({
        id: conversationId,
        tenantId,
        phone,

        brideName: null,
        weddingDate: null,

        assignedTo: null,          // 👈 preparado para atendimento
        status: "open",

        lastMessage: text,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      // 3️⃣ Atualizar conversation existente
      conversationRef = convoSnap.docs[0].ref;
      conversationId = convoSnap.docs[0].id;

      await conversationRef.update({
        lastMessage: text,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // 4️⃣ Criar message (sempre)
    const messageRef = db.collection("messages").doc();

    await messageRef.set({
      id: messageRef.id,
      conversationId,
      tenantId,

      from: "client",
      userId: null,

      type: "text",
      text,
      media: null,

      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      ok: true,
      conversationId,
      messageId: messageRef.id,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});
