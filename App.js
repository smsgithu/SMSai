import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, BookOpen, Wallet, Coins, TrendingUp, Shield, Sparkles } from 'lucide-react';

const SolanaAssistant = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Hey! Welcome to Solana Made Simple. I'm your AI guide to everything Solana — from wallets and seed phrases to DeFi, staking, memecoins, and RWAs. What would you like to learn today?"
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    { icon: Wallet, text: 'How do I create a Solana wallet?', color: 'from-purple-500 to-pink-500' },
    { icon: Shield, text: 'What are seed phrases?', color: 'from-blue-500 to-cyan-500' },
    { icon: TrendingUp, text: 'Explain DeFi and staking', color: 'from-green-500 to-emerald-500' },
    { icon: Coins, text: 'Tell me about Solana memecoins', color: 'from-orange-500 to-red-500' }
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (promptText = null) => {
    const userMessage = promptText || input.trim();
    if (!userMessage || loading) return;

    const updatedMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      console.log('🔥 Sending request to /api/chat');

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: updatedMessages
        })
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();

      const assistantMessage = data?.content
        ?.filter(block => block.type === 'text')
        .map(block => block.text)
        .join('\n') || 'No response received.';

      setMessages([...updatedMessages, { role: 'assistant', content: assistantMessage }]);
    } catch (error) {
      console.error(error);
      setMessages([
        ...updatedMessages,
        {
          role: 'assistant',
          content:
            "I'm having trouble connecting right now. Please try again in a moment."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-black/40 backdrop-blur-lg border-b border-purple-500/30 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Solana Made Simple</h1>
            <p className="text-sm text-purple-300">Education First · AI-Powered</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl px-5 py-3 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-white/10 backdrop-blur-lg text-white border border-white/20'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl px-5 py-3 border border-white/20">
                <Loader2 className="w-5 h-5 text-purple-300 animate-spin" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Prompts */}
      {messages.length === 1 && (
        <div className="px-4 pb-4">
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSubmit(prompt.text)}
                className={`flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r ${prompt.color} text-white font-medium shadow-lg hover:scale-105 transition`}
              >
                <prompt.icon className="w-5 h-5" />
                {prompt.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-black/40 backdrop-blur-lg border-t border-purple-500/30 px-4 py-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask anything about Solana…"
            disabled={loading}
            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-5 py-3 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={() => handleSubmit()}
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl px-6 py-3 flex items-center"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Send />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SolanaAssistant;
