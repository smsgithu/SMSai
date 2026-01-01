import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Loader2,
  BookOpen,
  Wallet,
  Coins,
  TrendingUp,
  Shield,
  Sparkles,
  Home
} from 'lucide-react';

const WELCOME_MESSAGE = {
  role: 'assistant',
  content:
    "GM 👋 Welcome to **Solana Made Simple AI**.\n\nI’m your guide to the Solana ecosystem — from wallets and seed phrases to staking, DeFi, memecoins, RWAs, and how Solana actually works under the hood.\n\nNo hype. Just clarity. What do you want to learn?"
};

const SolanaAssistant = () => {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    { icon: Wallet, text: 'How do wallets work?' },
    { icon: Shield, text: 'What is a seed phrase?' },
    { icon: TrendingUp, text: 'Explain DeFi and staking' },
    { icon: Coins, text: 'How do Solana memecoins work?' }
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const resetChat = () => {
    setMessages([WELCOME_MESSAGE]);
    setInput('');
    setLoading(false);
  };

  const handleSubmit = async (promptText = null) => {
    const userMessage = promptText || input.trim();
    if (!userMessage || loading) return;

    const updatedMessages = [
      ...messages,
      { role: 'user', content: userMessage }
    ];

    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages })
      });

      if (!res.ok) {
        throw new Error('AI request failed');
      }

      const data = await res.json();

      setMessages([
        ...updatedMessages,
        { role: 'assistant', content: data.content }
      ]);
    } catch (err) {
      setMessages([
        ...updatedMessages,
        {
          role: 'assistant',
          content:
            "⚠️ I’m having trouble connecting right now. Please try again in a moment."
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
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                Solana Made Simple
              </h1>
              <p className="text-sm text-purple-300">
                Education First · AI Powered
              </p>
            </div>
          </div>

          <button
            onClick={resetChat}
            className="flex items-center gap-2 text-purple-300 hover:text-white transition"
          >
            <Home className="w-5 h-5" />
            <span className="text-sm">Home</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 mr-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
              )}
              <div
                className={`max-w-2xl px-5 py-3 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-white/10 border border-white/20 text-white'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-purple-300 animate-spin" />
              <span className="text-purple-300 text-sm">
                Thinking…
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Prompts */}
      {messages.length === 1 && (
        <div className="px-4 pb-4">
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickPrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSubmit(p.text)}
                className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-700 to-pink-700 text-white hover:scale-105 transition"
              >
                <p.icon className="w-5 h-5" />
                {p.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-black/40 border-t border-purple-500/30 px-4 py-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask anything about Solana…"
            disabled={loading}
            className="flex-1 rounded-xl px-5 py-3 bg-white/10 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={() => handleSubmit()}
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-3 rounded-xl text-white disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SolanaAssistant;
