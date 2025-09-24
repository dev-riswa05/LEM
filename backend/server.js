// Import des modules
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// Initialisation
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: "https://lem-tau.vercel.app" // URL frontend déployé
}));
app.use(bodyParser.json());

// Initialisation Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Fonction retry pour Gemini
const generateContentWithRetry = async (prompt, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      if (error.status === 503 && i < maxRetries - 1) {
        console.warn(`⏳ Modèle saturé, réessai ${i + 1} après ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      } else {
        console.error("Erreur Gemini:", error.message);
        throw error;
      }
    }
  }
};

// Instruction système pour Gemini
const healthInstruction = `
Vous êtes un assistant virtuel spécialisé en santé.
Répondez uniquement aux questions relatives à la santé.
Si non, répondez : "Je suis désolé, je suis programmé uniquement pour répondre aux questions relatives à la santé."
Répondez clairement, concis et bienveillant.
`;

// Routes

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Serveur actif 🚀" });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) return res.status(400).json({ error: "Message requis" });

    const fullPrompt = `
${healthInstruction}
Conversation précédente :
${history ? history.map(msg => `${msg.role}: ${msg.content}`).join("\n") : ""}
Utilisateur : ${message}
Réponse :
    `;

    const text = await generateContentWithRetry(fullPrompt);
    res.json({ response: text });

  } catch (error) {
    console.error("❌ Erreur /api/chat :", error.message);
    res.status(500).json({ error: "Erreur backend: " + error.message });
  }
});

app.post("/api/summarize", async (req, res) => {
  try {
    const { conversation } = req.body;

    if (!conversation || conversation.length === 0) {
      return res.status(400).json({ error: "Aucune conversation à résumer" });
    }

    const summaryPrompt = `
${healthInstruction}
Résume la conversation suivante :
${conversation.map(msg => `${msg.sender}: ${msg.text}`).join("\n")}
    `;

    const summary = await generateContentWithRetry(summaryPrompt);
    res.json({ response: summary });

  } catch (error) {
    console.error("❌ Erreur /api/summarize :", error.message);
    res.status(500).json({ error: "Erreur backend: " + error.message });
  }
});

app.post("/api/tip", (req, res) => {
  try {
    const tips = [
      "Buvez au moins 1,5L d'eau par jour.",
      "Marchez 30 minutes par jour.",
      "Dormez 7-8 heures par nuit.",
      "Mangez 5 portions de fruits et légumes par jour.",
      "Pratiquez la respiration profonde.",
      "Faites des pauses régulières.",
      "Lavez-vous les mains fréquemment.",
      "Limitez le temps d'écran avant le coucher.",
      "Étirez-vous quotidiennement.",
      "Consultez régulièrement votre médecin."
    ];

    const today = new Date().getDate();
    const dailyTip = tips[today % tips.length];
    res.json({ response: dailyTip });

  } catch (error) {
    console.error("❌ Erreur /api/tip :", error.message);
    res.status(500).json({ error: "Erreur backend: " + error.message });
  }
});

app.get("/", (req, res) => {
  res.json({
    message: "Backend Assistant Santé IA - Express.js",
    version: "1.0.0",
    endpoints: [
      "POST /api/chat",
      "POST /api/summarize",
      "POST /api/tip",
      "GET /api/health"
    ]
  });
});

// Lancer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});
