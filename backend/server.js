// Import des modules nécessaires
const express = require("express"); // Framework web pour Node.js
const cors = require("cors"); // Middleware pour gérer les politiques CORS
const bodyParser = require("body-parser"); // Middleware pour parser le corps des requêtes
const { GoogleGenerativeAI } = require("@google/generative-ai"); // Librairie Gemini
require("dotenv").config(); // Chargement des variables d'environnement depuis .env

// Initialisation de l'application Express
const app = express();

// Port du serveur : prend la valeur dans .env ou 3001 par défaut
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({ origin: "https://lem-tau.vercel.app/" }));
 // Permet les requêtes depuis n'importe quelle origine (CORS)
app.use(bodyParser.json()); // Permet de lire le corps des requêtes au format JSON

// Initialiser Gemini AI avec la clé API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // Chargement du modèle Gemini

/**
 * Fonction pour générer du contenu avec retry si le modèle renvoie une erreur 503
 * @param {string} prompt - Le texte d'entrée pour Gemini
 * @param {number} maxRetries - Nombre maximum de tentatives
 * @param {number} delay - Délai initial entre les tentatives en ms
 * @returns {string} - Texte généré
 */
const generateContentWithRetry = async (prompt, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await model.generateContent(prompt); // Appel au modèle Gemini
      return result.response.text(); // Retourne le texte généré
    } catch (error) {
      // Si erreur 503 (modèle saturé) et qu'il reste des tentatives
      if (error.status === 503 && i < maxRetries - 1) {
        console.warn(`⏳ Modèle saturé, réessai ${i + 1} après ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay)); // Attendre avant retry
        delay *= 2; // Double le délai pour la prochaine tentative
      } else {
        throw error; // Sinon, rejette l'erreur
      }
    }
  }
};

// Instruction système pour le modèle
const healthInstruction = `
Vous êtes un assistant virtuel spécialisé en santé. 
Vous devez uniquement répondre aux questions relatives à la santé.
Si une question ne concerne pas la santé, répondez : 
"Je suis désolé, je suis programmé uniquement pour répondre aux questions relatives à la santé."
Répondez de manière claire, concise et bienveillante.
`;

/**
 * Route GET pour vérifier la santé du serveur
 */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Serveur actif 🚀" });
});

/**
 * Route POST pour la conversation
 */
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body; // Récupération du message utilisateur et de l'historique

    if (!message) {
      return res.status(400).json({ error: "Message requis" }); // Vérifie que le message est présent
    }

    // Création du prompt complet pour Gemini
    const fullPrompt = `
${healthInstruction}
Conversation précédente :
${history ? history.map(msg => `${msg.role}: ${msg.content}`).join("\n") : ""}
Utilisateur : ${message}
Réponse :
    `;

    const text = await generateContentWithRetry(fullPrompt); // Appel à Gemini avec retry

    res.json({ response: text }); // Envoi de la réponse au frontend
  } catch (error) {
    console.error("❌ Erreur /api/chat :", error.message);
    res.status(500).json({ error: "Erreur backend: " + error.message });
  }
});

/**
 * Route POST pour résumer la conversation
 */
app.post("/api/summarize", async (req, res) => {
  try {
    const { conversation } = req.body;

    if (!conversation || conversation.length === 0) {
      return res.status(400).json({ error: "Aucune conversation à résumer" });
    }

    // Création du prompt pour résumer
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

/**
 * Route POST pour obtenir une astuce santé
 */
app.post("/api/tip", async (req, res) => {
  try {
    // Liste des astuces santé
   const tips = [
    "Buvez au moins 1,5L d'eau par jour pour une bonne hydratation.",
    "Marchez 30 minutes par jour pour améliorer votre santé cardiovasculaire.",
    "Dormez 7-8 heures par nuit pour une récupération optimale.",
    "Mangez 5 portions de fruits et légumes par jour.",
    "Pratiquez la respiration profonde pour réduire le stress.",
    "Faites des pauses régulières si vous travaillez assis toute la journée.",
    "Lavez-vous les mains fréquemment pour prévenir les infections.",
    "Limitez le temps d'écran avant le coucher pour améliorer votre sommeil.",
    "Étirez-vous quotidiennement pour maintenir votre flexibilité.",
    "Consultez régulièrement votre médecin pour un suivi préventif.",
    "Prenez 15 minutes de soleil par jour pour faire le plein de vitamine D.",
    "Pratiquez la méditation 10 minutes par jour pour votre bien-être mental.",
    "Maintenez une posture droite pour prévenir les maux de dos.",
    "Évitez de fumer et limitez votre consommation d'alcool.",
    "Pesez-vous une fois par semaine pour suivre votre poids.",
    "Mastiquez lentement vos aliments pour une meilleure digestion.",
    "Intégrez des oméga-3 dans votre alimentation (poissons, noix).",
    "Limitez votre consommation de sel à 5g par jour maximum.",
    "Prenez un petit-déjeuner équilibré chaque matin.",
    "Consommez des fibres pour réguler votre transit intestinal.",
    "Montez les escaliers plutôt que de prendre l'ascenseur.",
    "Pratiquez la marche rapide 3 fois par semaine.",
    "Renforcez vos muscles abdominaux pour soutenir votre dos.",
    "Étirez-vous après chaque séance de sport.",
    "Variez les activités physiques pour solliciter différents muscles.",
    "Établissez une routine relaxante avant le coucher.",
    "Maintenez une température de 18-19°C dans votre chambre.",
    "Évitez les repas lourds et la caféine 3 heures avant de dormir.",
    "Lisez un livre papier plutôt que sur écran le soir.",
    "Pratiquez la gratitude pour améliorer votre qualité de sommeil.",
    "Socialisez régulièrement pour entretenir votre santé cognitive.",
    "Fixez-vous des objectifs réalisables pour maintenir la motivation.",
    "Prenez du temps pour vos hobbies chaque semaine.",
    "Apprenez à dire non pour préserver votre énergie.",
    "Pratiquez une activité créative pour stimuler votre cerveau.",
    "Protégez votre peau du soleil avec une crème solaire.",
    "Faites vérifier votre vue tous les 2 ans.",
    "Utilisez des protections auditives en environnement bruyant.",
    "Désinfectez régulièrement votre téléphone portable.",
    "Portez des chaussures adaptées à votre morphologie.",
    "Faites une activité en plein air chaque week-end.",
    "Limitez les boissons sucrées et privilégiez l'eau.",
    "Pratiquez des exercices de relaxation oculaire.",
    "Aérez votre domicile 10 minutes par jour.",
    "Consommez des probiotiques pour votre flore intestinale.",
    "Apprenez une nouvelle compétence pour stimuler votre cerveau.",
    "Organisez votre espace de travail pour réduire le stress.",
    "Écoutez de la musique relaxante pour diminuer l'anxiété.",
    "Planifiez vos repas de la semaine pour une alimentation équilibrée.",
    "Souriez souvent, cela améliore l'humeur naturellement."
];

    const today = new Date().getDate(); // Jour du mois
    const dailyTip = tips[today % tips.length]; // Astuce du jour

    res.json({ response: dailyTip });
  } catch (error) {
    console.error("❌ Erreur /api/tip :", error.message);
    res.status(500).json({ error: "Erreur backend: " + error.message });
  }
});

/**
 * Route racine pour indiquer que le backend fonctionne
 */
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

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});
