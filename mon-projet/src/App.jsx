import React, { useState, useRef, useEffect } from 'react';

export default function App() {
  const [showChat, setShowChat] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isGettingTip, setIsGettingTip] = useState(false);
  const [theme, setTheme] = useState('light');
  const [userAccentColor, setUserAccentColor] = useState('bg-green-600');
  const [aiAccentColor, setAiAccentColor] = useState('bg-gray-500');

  const colors = [
    'bg-purple-600', 'bg-blue-600', 'bg-red-600',
    'bg-orange-600', 'bg-yellow-600', 'bg-green-600'
  ];

  const endRef = useRef(null);

  // 📌 URL du backend codée en dur
  const backendUrl = "https://lem-j7hw.vercel.app";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const callBackendApi = async (userMessage, actionType = 'chat') => {
    try {
      let endpoint = '/api/chat';
      let body = {
        message: userMessage,
        history: messages.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        }))
      };

      if (actionType === 'summarize') {
        endpoint = '/api/summarize';
        body = { conversation: messages };
      } else if (actionType === 'tip') {
        endpoint = '/api/tip';
        body = {};
      }

      const res = await fetch(`${backendUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        console.error("Erreur backend", res.status, res.statusText);
        throw new Error(`Erreur backend: ${res.status}`);
      }

      const data = await res.json();
      return data.response || data.message || "Réponse reçue";
    } catch (error) {
      console.error('Erreur backend:', error);
      return `Désolé, le service est temporairement indisponible. Erreur: ${error.message}`;
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = { id: Date.now(), text: message.trim(), sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    const botText = await callBackendApi(userMessage.text, 'chat');

    if (botText) {
      setMessages(prev => [...prev, { id: Date.now() + 1, text: botText, sender: 'ai' }]);
    }

    setIsLoading(false);
  };

  const handleSummarize = async () => {
    if (messages.length === 0 || isSummarizing || isLoading) return;
    setIsSummarizing(true);

    const summaryText = await callBackendApi('', 'summarize');
    if (summaryText) {
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 100, text: `📋 Résumé : ${summaryText}`, sender: 'ai' }
      ]);
    }

    setIsSummarizing(false);
  };

  const handleDailyTip = async () => {
    if (isGettingTip || isLoading) return;
    setIsGettingTip(true);

    const tipText = await callBackendApi('', 'tip');
    if (tipText) {
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 200, text: `💡 Astuce Santé : ${tipText}`, sender: 'ai' }
      ]);
    }

    setIsGettingTip(false);
  };

  const handleNewConversation = () => setMessages([]);
  const handleThemeChange = (t) => setTheme(t);
  const handleUserColorChange = (c) => setUserAccentColor(c);
  const handleAiColorChange = (c) => setAiAccentColor(c);

  return (
    <div className={`flex h-screen font-inter relative ${theme === 'dark' ? 'bg-gray-950' : 'bg-gray-100'}`}>
      {!showChat ? (
        <div className="flex-1 flex flex-col items-center justify-center relative z-20">
          <div className="flex flex-col items-center p-8 rounded-2xl shadow-2xl bg-white/50 backdrop-blur-sm">
            <h1 className="text-4xl font-extrabold text-gray-800 text-center mb-4">Votre Guide Bien-Être</h1>
            <button
              className="px-8 py-4 text-xl font-bold rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg transition"
              onClick={() => setShowChat(true)}
            >
              Démarrer
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex flex-col p-4">
            <div className="flex-1 overflow-y-auto p-3 flex flex-col">
              {messages.length === 0 && <div className="text-center text-gray-500 py-8">💬 Commencez la conversation !</div>}
              {messages.map(msg => (
                <div key={msg.id} className={`p-4 rounded-2xl max-w-[90%] ${msg.sender === 'user' ? `${userAccentColor} text-white self-end` : `${aiAccentColor} text-white self-start`}`}>
                  <p>{msg.text}</p>
                </div>
              ))}
              {isLoading && <div className={`p-4 rounded-2xl ${aiAccentColor} text-white max-w-md`}>Chargement...</div>}
              <div ref={endRef} />
            </div>
            <div className="p-3 flex items-center gap-2 border-t">
              <button onClick={handleSummarize} disabled={isSummarizing || isLoading}>RESUMER</button>
              <button onClick={handleDailyTip} disabled={isGettingTip || isLoading}>ASTUCE</button>
              <input
                type="text"
                placeholder="Posez votre question santé..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button onClick={handleSendMessage} disabled={isLoading || !message.trim()}>➤</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
