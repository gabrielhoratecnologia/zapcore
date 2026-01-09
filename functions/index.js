const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

exports.whatsappWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") return res.sendStatus(404);

  try {
    const value = req.body?.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];

    if (!message) return res.sendStatus(200);

    const phone = message.from;
    const text = message.text?.body || null;

    const tenantId = "zapcore-dev"; // depois resolve dinamicamente
    const conversationId = `${tenantId}_${phone}`;

    const conversationRef = db.collection("conversations").doc(conversationId);
    const conversationSnap = await conversationRef.get();

    // 🔹 cria conversa apenas se não existir
    if (!conversationSnap.exists) {
      await conversationRef.set({
        id: conversationId,
        tenantId,
        phone,
        lastMessage: text,
        status: "open",
        assignedTo: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      // 🔹 atualiza apenas o necessário
      await conversationRef.update({
        lastMessage: text,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // 🔹 salva mensagem (modelo atual)
    await db.collection("messages").add({
      conversationId,
      tenantId,
      from: "client",
      text,
      type: message.type,
      media: null,
      userId: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err);
    return res.sendStatus(500);
  }
});
