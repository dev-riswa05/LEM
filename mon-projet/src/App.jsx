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
    'bg-orange-600', 'bg-yellow-600', 'bg-green-600',
  ];

  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const BACKEND_URL = 'https://lem-dusky.vercel.app';

  const callBackendApi = async (userMessage, actionType = 'chat') => {
    try {
      let endpoint = '/api/chat';
      let options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: messages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
          }))
        })
      };

      if (actionType === 'summarize') {
        endpoint = '/api/summarize';
        options.body = JSON.stringify({ conversation: messages });
      } else if (actionType === 'tip') {
        endpoint = '/api/tip';
        options = { method: 'GET' };
      }

      const res = await fetch(`${BACKEND_URL}${endpoint}`, options);

      if (!res.ok) {
        throw new Error(`Erreur backend: ${res.status}`);
      }

      const data = await res.json();

      if (actionType === 'tip') return data.tip;
      if (actionType === 'summarize') return data.summary;
      return data.response;

    } catch (error) {
      console.error('Erreur backend:', error);
      return `Désolé, le service est temporairement indisponible. Erreur: ${error.message}`;
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = { id: Date.now(), text: message.trim(), sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    const botText = await callBackendApi(userMessage.text, 'chat');

    if (botText) {
      setMessages((prev) => [...prev, { id: Date.now() + 1, text: botText, sender: 'ai' }]);
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
        {
          id: Date.now() + 100,
          text: `📋 **Résumé de la conversation** : ${summaryText}`,
          sender: 'ai'
        }
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
        {
          id: Date.now() + 200,
          text: `💡 **Astuce Santé** : ${tipText}`,
          sender: 'ai'
        }
      ]);
    }
    setIsGettingTip(false);
  };

  const handleNewConversation = () => setMessages([]);
  const handleThemeChange = (t) => setTheme(t);
  const handleUserColorChange = (c) => setUserAccentColor(c);
  const handleAiColorChange = (c) => setAiAccentColor(c);

  return (
    <div className={`flex flex-col md:flex-row h-screen font-inter relative ${theme === 'dark' ? 'bg-gray-950' : 'bg-gray-100'}`}>
      {!showChat ? (
        <div className="flex-1 flex flex-col items-center justify-center relative z-20 p-4">
          <div className="flex flex-col items-center p-6 md:p-8 rounded-2xl shadow-2xl bg-white/50 backdrop-blur-sm animate-fade-in transition-all max-w-lg w-full">
            <svg className="w-20 h-20 mb-4 md:w-24 md:h-24 text-red-600 animate-pulse transition-transform" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5A5.5 5.5 0 017.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3A5.5 5.5 0 0122 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-800 text-center mb-4 leading-tight">
              Votre Guide Bien-Être
            </h1>
            <p className="text-gray-800 text-center text-sm md:text-lg mb-6">
              Discutez de vos préoccupations en matière de santé en toute confidentialité
            </p>
            <button className="px-6 py-3 md:px-8 md:py-4 text-lg md:text-xl font-bold rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg transition transform hover:scale-105">
              Démarrer
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Sidebar */}
          <div className={`hidden md:flex relative z-10 md:w-1/4 p-4 md:p-6 flex-col space-y-6 overflow-y-auto ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>
            <h2 className="text-xl md:text-2xl font-bold">Personnalisation</h2>
            <button className="px-4 py-2 text-sm font-semibold rounded-full bg-green-500 hover:bg-green-600 text-white transition">
              Nouvelle conversation
            </button>

            <div className="flex flex-col space-y-4">
              <h3 className="text-lg font-semibold">Thème</h3>
              <div className="flex space-x-3">
                <button className={`p-3 rounded-xl border-2 ${theme === 'light' ? 'border-blue-500' : 'border-transparent'} bg-white text-gray-800`} onClick={() => handleThemeChange('light')}>
                  ☀️ Clair
                </button>
                <button className={`p-3 rounded-xl border-2 ${theme === 'dark' ? 'border-blue-500' : 'border-transparent'} bg-gray-800 text-white`} onClick={() => handleThemeChange('dark')}>
                  🌙 Sombre
                </button>
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <h3 className="text-lg font-semibold">Couleur utilisateur</h3>
              <div className="flex flex-wrap gap-2">
                {colors.map((color, i) => (
                  <button key={i} className={`w-8 h-8 rounded-full cursor-pointer border-2 ${color} ${userAccentColor === color ? 'border-white' : 'border-transparent'}`} onClick={() => handleUserColorChange(color)} />
                ))}
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <h3 className="text-lg font-semibold">Couleur IA</h3>
              <div className="flex flex-wrap gap-2">
                {colors.map((color, i) => (
                  <button key={i} className={`w-8 h-8 rounded-full cursor-pointer border-2 ${color} ${aiAccentColor === color ? 'border-white' : 'border-transparent'}`} onClick={() => handleAiColorChange(color)} />
                ))}
              </div>
            </div>
          </div>

          {/* Zone de chat */}
          <div className={`flex-1 flex flex-col overflow-hidden w-full min-h-0 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>
            <div className="flex items-center justify-between p-3 md:p-4 border-b border-gray-300">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-green-500 mr-2 flex items-center justify-center">🏥</div>
                <span className="text-lg md:text-xl font-bold">Assistant Santé</span>
              </div>
              <button className="md:hidden p-2 rounded-full bg-gray-200 hover:bg-gray-300" onClick={() => setShowChat(false)}>← Retour</button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 md:p-6 flex flex-col min-h-0">
              <div className="flex flex-col space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <p className="text-lg">💬 Commencez la conversation !</p>
                    <p className="text-sm">Exemple : "Bonjour, j'ai mal à la tête"</p>
                  </div>
                )}

                {messages.map((msg) => (
                  <div key={msg.id} className={`p-4 rounded-2xl max-w-full sm:max-w-[90%] md:max-w-md break-words ${msg.sender === 'user' ? `${userAccentColor} text-white self-end ml-auto` : `${aiAccentColor} text-white self-start`}`}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                ))}

                {isLoading && (
                  <div className={`p-4 rounded-2xl self-start ${aiAccentColor} text-white max-w-md`}>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-white animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-white animate-bounce delay-150" />
                      <div className="w-2 h-2 rounded-full bg-white animate-bounce delay-300" />
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>
            </div>

            <div className={`p-2 sm:p-3 md:p-4 border-t flex items-center gap-2 ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
              <button className="p-3 sm:p-4 rounded-full bg-purple-500 hover:bg-purple-600 text-white transition disabled:opacity-50" onClick={handleSummarize} disabled={isSummarizing || isLoading || isGettingTip || messages.length === 0}>
                {isSummarizing ? 'RESUMER...' : 'RESUMER'}
              </button>

              <button className="p-3 sm:p-4 rounded-full bg-orange-500 hover:bg-orange-600 text-white transition disabled:opacity-50" onClick={handleDailyTip} disabled={isGettingTip || isLoading || isSummarizing}>
                {isGettingTip ? 'ASTUCE...' : 'ASTUCE'}
              </button>

              <input
                type="text"
                placeholder="Posez votre question santé..."
                className={`flex-1 px-4 py-3 rounded-full border text-sm sm:text-base md:text-lg ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-100 border-gray-300 text-gray-800'}`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isLoading || isSummarizing || isGettingTip}
              />

              <button className="p-3 sm:p-4 rounded-full bg-green-500 hover:bg-green-600 text-white transition disabled:opacity-50" onClick={handleSendMessage} disabled={isLoading || isSummarizing || isGettingTip || !message.trim()}>
                ➤
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
