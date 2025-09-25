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
          text: `💡 **conseil Santé** : ${tipText}`,
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
    <div className={`flex flex-col min-h-screen font-inter relative overflow-hidden ${theme === 'dark' ? 'bg-gray-950' : 'bg-gray-100'}`}>
      {!showChat ? (
        <div className="flex-1 flex flex-col items-center justify-center relative z-20 p-4">
          {/* Page d'accueil */}
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row relative z-10 w-full overflow-hidden">
          
          {/* Sidebar */}
          <div className={`hidden md:flex relative z-10 md:w-1/4 lg:w-1/5 xl:w-1/6 p-6 flex-col space-y-6 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>
            {/* Personnalisation */}
          </div>

          {/* Zone Chat */}
          <div className={`flex-1 flex flex-col ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>

            {/* Header fixe */}
            <div className="flex items-center justify-between p-4 border-b border-gray-300 flex-none">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-green-500 mr-2 flex items-center justify-center">🏥</div>
                <span className="text-lg md:text-xl font-bold">Assistant Santé</span>
              </div>
              <button className="md:hidden p-2 rounded-full bg-gray-200 hover:bg-gray-300" onClick={() => setShowChat(false)}>← Retour</button>
            </div>

            {/* Messages — scroll interne */}
            <div className={`flex-1 overflow-y-auto p-3 md:p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <div className="flex flex-col space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <p className="text-lg">💬 Commencez la conversation !</p>
                  </div>
                )}
                {messages.map((msg) => (
                  <div key={msg.id} className={`p-4 rounded-2xl max-w-[90%] md:max-w-md break-words ${msg.sender === 'user' ? `${userAccentColor} text-white self-end ml-auto` : `${aiAccentColor} text-white self-start`}`}>
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

            {/* Barre fixe en bas */}
            <div className={`p-3 md:p-4 border-t flex items-center gap-2 flex-none ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
              <button className="p-3 rounded-full bg-purple-500 hover:bg-purple-600 text-white transition disabled:opacity-50" onClick={handleSummarize} disabled={isSummarizing || isLoading || isGettingTip || messages.length === 0}>
                {isSummarizing ? '📝 Résumer...' : '📝 Résumer'}
              </button>

              <button className="p-3 rounded-full bg-orange-500 hover:bg-orange-600 text-white transition disabled:opacity-50" onClick={handleDailyTip} disabled={isGettingTip || isLoading || isSummarizing}>
                {isGettingTip ? '🩺 Conseil...' : '🩺 Conseil'}
              </button>

              <input
                type="text"
                placeholder="Posez votre question santé..."
                className={`flex-1 px-4 py-3 rounded-full border text-sm md:text-base ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-100 border-gray-300 text-gray-800'}`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isLoading || isSummarizing || isGettingTip}
              />

              <button className="p-3 rounded-full bg-green-500 hover:bg-green-600 text-white transition disabled:opacity-50" onClick={handleSendMessage} disabled={isLoading || isSummarizing || isGettingTip || !message.trim()}>
                ➤
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

