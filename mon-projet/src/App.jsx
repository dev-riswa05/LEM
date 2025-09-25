import React, { useState, useRef, useEffect } from 'react';

export default function App() {
  // --- États principaux ---
  const [showChat, setShowChat] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isGettingTip, setIsGettingTip] = useState(false);
  const [theme, setTheme] = useState('light');
  const [userAccentColor, setUserAccentColor] = useState('bg-green-600');
  const [aiAccentColor, setAiAccentColor] = useState('bg-gray-500');
  const [showSidebar, setShowSidebar] = useState(false);

  // Palette de couleurs dispo
  const colors = [
    'bg-purple-600', 'bg-blue-600', 'bg-red-600',
    'bg-orange-600', 'bg-yellow-600', 'bg-green-600',
  ];

  // Permet de scroller vers le bas quand un nouveau message arrive
  const endRef = useRef(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // URL du backend
  const BACKEND_URL = 'https://lem-eight.vercel.app';

  /**
   * Fonction utilitaire pour appeler le backend
   */
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
      }
      else if (actionType === 'tip') {
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

  /**
   * Envoi d'un message utilisateur
   */
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

  /**
   * Génération d'un résumé de la conversation
   */
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

  /**
   * Récupération d'un conseil santé quotidien
   */
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

  // Réinitialise la conversation
  const handleNewConversation = () => setMessages([]);

  // Changement de thème et couleurs
  const handleThemeChange = (t) => setTheme(t);
  const handleUserColorChange = (c) => setUserAccentColor(c);
  const handleAiColorChange = (c) => setAiAccentColor(c);

  // Fonction pour formater le texte de l'IA avec du Markdown
  const formatMarkdown = (text) => {
    let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/^- (.*)$/gm, '<li>$1</li>');
    if (html.includes('<li>')) {
      html = `<ul>${html}</ul>`;
    }
    return html;
  };

  return (
    <div className={`flex flex-col min-h-screen font-inter relative ${theme === 'dark' ? 'bg-gray-950' : 'bg-gray-100'}`}>
      {/* Page d'accueil (avant ouverture du chat) */}
      {!showChat ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
          <div className="flex flex-col items-center p-4 sm:p-6 md:p-8 rounded-2xl shadow-2xl bg-white/50 backdrop-blur-sm max-w-xs sm:max-w-sm md:max-w-lg w-full mx-auto">
            {/* Icône cœur */}
            <svg className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mb-4 sm:mb-6 text-red-600 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5A5.5 5.5 0 017.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3A5.5 5.5 0 0122 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-extrabold text-gray-800 text-center mb-3 sm:mb-4 leading-tight">
              Votre Assistant Santé IA
            </h2>
            <p className="text-gray-800 text-center text-sm sm:text-base md:text-lg lg:text-xl mb-6 sm:mb-8">
              Discutez de vos préoccupations santé, en toute sécurité.
            </p>
            <button className="px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg md:text-xl font-bold rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg transition-transform hover:scale-105 w-full max-w-xs" onClick={() => setShowChat(true)}>
              Parlez à Santé IA
            </button>
          </div>
        </div>
      ) : (
        // --- Chat principal ---
        <div className="flex flex-col md:flex-row h-screen w-full">

          {/* Overlay pour mobile quand la sidebar est ouverte */}
          {showSidebar && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
              onClick={() => setShowSidebar(false)}
            />
          )}

          {/* Barre latérale (personnalisation) */}
          <div className={`fixed inset-y-0 right-0 z-20 w-4/5 sm:w-3/4 md:relative md:w-64 lg:w-72 xl:w-80 p-4 sm:p-6 flex flex-col space-y-4 sm:space-y-6 overflow-y-auto transition-transform duration-300 transform ${showSidebar ? 'translate-x-0' : 'translate-x-full md:translate-x-0'} ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>
            <div className="flex justify-between items-center mb-4 md:hidden">
              <h2 className="text-xl font-bold">Paramètres</h2>
              <button className="p-2 rounded-full bg-gray-200 hover:bg-gray-300" onClick={() => setShowSidebar(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <button className="px-3 py-2 sm:px-4 sm:py-2 text-sm font-semibold rounded-full bg-green-500 hover:bg-green-600 text-white transition" onClick={handleNewConversation}>
              Nouvelle conversation
            </button>

            {/* Changer thème */}
            <div className="flex flex-col space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold">Thème</h3>
              <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0">
                <button className={`p-2 sm:p-3 rounded-xl border-2 text-sm sm:text-base ${theme === 'light' ? 'border-blue-500' : 'border-transparent'} bg-white text-gray-800`} onClick={() => handleThemeChange('light')}>
                  ☀️ Clair
                </button>
                <button className={`p-2 sm:p-3 rounded-xl border-2 text-sm sm:text-base ${theme === 'dark' ? 'border-blue-500' : 'border-transparent'} bg-gray-800 text-white`} onClick={() => handleThemeChange('dark')}>
                  🌙 Sombre
                </button>
              </div>
            </div>

            {/* Couleur utilisateur */}
            <div className="flex flex-col space-y-2 sm:space-y-3">
              <h3 className="text-base sm:text-lg font-semibold">Couleur utilisateur</h3>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {colors.map((color, i) => (
                  <button key={i} className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full cursor-pointer border-2 ${color} ${userAccentColor === color ? 'border-white' : 'border-transparent'}`} onClick={() => handleUserColorChange(color)} />
                ))}
              </div>
            </div>

            {/* Couleur IA */}
            <div className="flex flex-col space-y-2 sm:space-y-3">
              <h3 className="text-base sm:text-lg font-semibold">Couleur IA</h3>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {colors.map((color, i) => (
                  <button key={i} className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full cursor-pointer border-2 ${color} ${aiAccentColor === color ? 'border-white' : 'border-transparent'}`} onClick={() => handleAiColorChange(color)} />
                ))}
              </div>
            </div>
          </div>

          {/* Zone de chat */}
          <div className={`flex-1 flex flex-col min-h-0 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>
            {/* En-tête du chat */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-300 flex-shrink-0">
              <div className="flex items-center">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-green-500 mr-2 flex items-center justify-center text-xs sm:text-base">🏥</div>
                <span className="text-base sm:text-lg md:text-xl font-bold">Assistant Santé</span>
              </div>
              <div className="flex gap-2">
                {/* Bouton Paramètres mobile */}
                <button className="md:hidden p-2 rounded-full bg-gray-200 hover:bg-gray-300" onClick={() => setShowSidebar(true)}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.284 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <button className="md:hidden p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-sm" onClick={() => setShowChat(false)}>← Retour</button>
              </div>
            </div>

            {/* Messages avec scroll interne */}
            <div className={`flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 lg:p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <div className="flex flex-col space-y-3 sm:space-y-4">
                {/* Message par défaut quand la conversation est vide */}
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <p className="text-base sm:text-lg">💬 Commencez la conversation !</p>
                    <p className="text-xs sm:text-sm">Exemple : "Bonjour, j'ai mal à la tête"</p>
                  </div>
                )}

                {/* Affichage des messages */}
                {messages.map((msg) => (
                  <div key={msg.id} className={`p-3 sm:p-4 max-w-[95%] xs:max-w-[90%] sm:max-w-md break-words ${msg.sender === 'user' ? `${userAccentColor} text-white self-end ml-auto rounded-l-2xl rounded-tr-2xl` : `${aiAccentColor} text-white self-start rounded-r-2xl rounded-tl-2xl`}`}>
                    {msg.sender === 'ai' ? (
                      <div className="text-sm sm:text-base" dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.text) }} />
                    ) : (
                      <p className="whitespace-pre-wrap text-sm sm:text-base">{msg.text}</p>
                    )}
                  </div>
                ))}

                {/* Loader quand l'IA réfléchit */}
                {isLoading && (
                  <div className={`p-3 sm:p-4 rounded-2xl self-start ${aiAccentColor} text-white max-w-md`}>
                    <div className="w-8 h-2 sm:w-10 sm:h-3 rounded-full bg-white/50 animate-pulse" />
                  </div>
                )}
                <div ref={endRef} />
              </div>
            </div>

            {/* Barre d'input fixée en bas */}
            <div className={`p-2 sm:p-3 md:p-4 border-t flex items-center gap-1 sm:gap-2 flex-shrink-0 ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
              {/* Bouton résumé */}
              <div className="relative group">
                <button className={`p-2 sm:p-3 rounded-full text-white transition disabled:opacity-50 ${isSummarizing ? 'bg-gray-400' : 'bg-purple-500 hover:bg-purple-600'}`} onClick={handleSummarize} disabled={isSummarizing || isLoading || isGettingTip || messages.length === 0} aria-label="Résumer la conversation">
                  <span className="hidden sm:inline text-xs sm:text-sm">📝 Résumer</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 sm:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <line x1="10" y1="9" x2="8" y2="9"></line>
                  </svg>
                </button>
                <span className="absolute left-1/2 -top-8 -translate-x-1/2 hidden group-hover:block px-2 py-1 bg-gray-700 text-white text-xs rounded-lg whitespace-nowrap z-30">
                  Résumer
                </span>
              </div>

              {/* Bouton conseil */}
              <div className="relative group">
                <button className={`p-2 sm:p-3 rounded-full text-white transition disabled:opacity-50 ${isGettingTip ? 'bg-gray-400' : 'bg-orange-500 hover:bg-orange-600'}`} onClick={handleDailyTip} disabled={isGettingTip || isLoading || isSummarizing} aria-label="Obtenir un conseil santé">
                  <span className="hidden sm:inline text-xs sm:text-sm">🩺 Conseil</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 sm:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"></path>
                    <path d="M12 8v4l3 3"></path>
                  </svg>
                </button>
                <span className="absolute left-1/2 -top-8 -translate-x-1/2 hidden group-hover:block px-2 py-1 bg-gray-700 text-white text-xs rounded-lg whitespace-nowrap z-30">
                  Conseil
                </span>
              </div>

              {/* Champ texte */}
              <input 
                type="text" 
                placeholder="Posez votre question santé..." 
                className={`flex-1 px-3 py-2 sm:px-4 sm:py-3 rounded-full border text-xs sm:text-sm md:text-base ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-100 border-gray-300 text-gray-800'}`} 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} 
                disabled={isLoading || isSummarizing || isGettingTip} 
              />

              {/* Bouton envoyer */}
              <div className="relative group">
                <button className="p-2 sm:p-3 rounded-full bg-green-500 hover:bg-green-600 text-white transition disabled:opacity-50" onClick={handleSendMessage} disabled={isLoading || isSummarizing || isGettingTip || !message.trim()} aria-label="Envoyer">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z"></path>
                  </svg>
                </button>
                <span className="absolute left-1/2 -top-8 -translate-x-1/2 hidden group-hover:block px-2 py-1 bg-gray-700 text-white text-xs rounded-lg whitespace-nowrap z-30">
                  Envoyer
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}