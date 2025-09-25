const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'https://lem-pdgo.vercel.app' }));
app.use(express.json());

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const callGeminiApi = async (prompt) => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Erreur Gemini :", error);
    return "Désolé, une erreur est survenue avec l'assistant.";
  }
};

// Chat & salutations
app.post('/api/chat', async (req, res) => {
  const { message, history } = req.body;
  if (!message) return res.status(400).json({ error: "Le message est requis" });

  const chatPrompt = `
Tu es un assistant virtuel spécialisé en santé et bien-être.
Répond uniquement aux questions ou préoccupations liées à la santé.
Ne donne pas de diagnostic médical.
Répond en français, clairement et avec bienveillance.

Historique :
${history.map(msg => `${msg.role === 'user' ? 'Utilisateur' : 'Assistant'}: ${msg.content}`).join('\n')}

Utilisateur: ${message}
Assistant:
`;

  const geminiResponse = await callGeminiApi(chatPrompt);
  res.json({ response: geminiResponse });
});

// Résumer conversation
app.post('/api/summarize', async (req, res) => {
  const { conversation } = req.body;
  if (!conversation || conversation.length === 0) return res.status(400).json({ error: "Conversation vide" });

  const summaryPrompt = `
Tu es un assistant santé. Résume cette conversation en un paragraphe clair et concis.

Conversation :
${conversation.map(msg => `${msg.sender === 'user' ? 'Utilisateur' : 'Assistant'}: ${msg.text}`).join('\n')}

Résumé:
`;

  const geminiResponse = await callGeminiApi(summaryPrompt);
  res.json({ summary: geminiResponse });
});

// Astuce santé
app.post('/api/tip', async (req, res) => {
  const tipPrompt = `
Tu es un assistant santé. Donne une astuce santé courte, positive, utile pour la journée.
Réponse en français.
`;

  const geminiResponse = await callGeminiApi(tipPrompt);
  res.json({ tip: geminiResponse });
});

// Test backend
app.get('/', (req, res) => {
  res.status(200).send('Backend Votre Guide Bien-Être est actif');
});

app.listen(PORT, () => {
  console.log(`Backend démarré sur http://localhost:${PORT}`);
});
