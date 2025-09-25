const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Configuration CORS pour prod et dev ---
app.use(cors({
    origin: [
        'https://lem-8dqk.vercel.app/', // ton front déployé
        
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware pour préflight OPTIONS


app.use(express.json());

// Vérification de la clé API
if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY manquante dans .env');
    if (process.env.NODE_ENV === 'development') process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'fake-key-for-init');

const callGeminiApi = async (prompt) => {
    try {
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'fake-key-for-init') {
            throw new Error('Clé API Gemini non configurée');
        }
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Erreur Gemini :", error);
        return "Désolé, une erreur est survenue avec l'assistant. Veuillez réessayer.";
    }
};

// --- Middleware log ---
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
});

// === ENDPOINTS ===

// 1. Santé
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Backend santé actif et opérationnel',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        geminiConfigured: !!process.env.GEMINI_API_KEY
    });
});

// 2. Chat
app.post('/api/chat', async (req, res) => {
    try {
        const { message, history = [] } = req.body;

        if (!message || message.trim() === '') {
            return res.status(400).json({ success: false, error: "Le message est requis" });
        }

        const chatPrompt = `
Tu es un assistant virtuel spécialisé en santé et bien-être.
Règles :
- Répond uniquement aux questions liées à la santé.
- Ne donne pas de diagnostic.
- Sois bienveillant et précis en français.

Historique :
${history.map(msg => `${msg.role === 'user' ? 'Utilisateur' : 'Assistant'}: ${msg.content}`).join('\n')}

Utilisateur: ${message}
Assistant:
`;

        const geminiResponse = await callGeminiApi(chatPrompt);

        res.json({
            success: true,
            response: geminiResponse,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Erreur /api/chat:', error);
        res.status(500).json({ success: false, error: "Erreur interne du serveur" });
    }
});

// 3. Résumer
app.post('/api/summarize', async (req, res) => {
    try {
        const { conversation = [] } = req.body;
        if (!conversation.length) return res.status(400).json({ success: false, error: "Conversation vide" });

        const summaryPrompt = `
Tu es un assistant santé. Résume cette conversation médicalement.

Conversation :
${conversation.map(msg => `${msg.sender === 'user' ? 'Utilisateur' : 'Assistant'}: ${msg.text}`).join('\n')}

Résumé :
`;

        const geminiResponse = await callGeminiApi(summaryPrompt);

        res.json({ success: true, summary: geminiResponse, timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('Erreur /api/summarize:', error);
        res.status(500).json({ success: false, error: "Erreur lors du résumé" });
    }
});

// 4. Astuce santé
app.get('/api/tip', async (req, res) => {
    try {
        const tipPrompt = `
Tu es un assistant santé. Donne une astuce santé courte, pratique et positive en français.
`;

        const geminiResponse = await callGeminiApi(tipPrompt);

        res.json({ success: true, tip: geminiResponse, timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('Erreur /api/tip:', error);
        res.status(500).json({ success: false, error: "Erreur lors de la génération de l'astuce" });
    }
});

// 5. Racine
app.get('/', (req, res) => {
    res.json({
        message: 'Backend Chatbot Santé actif',
        version: '1.0.0',
        endpoints: ['/api/health', '/api/chat', '/api/summarize', '/api/tip']
    });
});

// --- Erreur 404 ---
// --- Gestion des erreurs 404 ---
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint non trouvé',
        availableEndpoints: ['/api/health', '/api/chat', '/api/summarize', '/api/tip']
    });
});



// --- Erreur globale ---
app.use((error, req, res, next) => {
    console.error('Erreur globale:', error);
    res.status(500).json({ success: false, error: 'Erreur interne du serveur' });
});

// --- Démarrage ---
app.listen(PORT, () => {
    console.log(`✅ Backend démarré sur http://localhost:${PORT}`);
});
