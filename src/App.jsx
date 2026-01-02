import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, BookOpen, Wallet, Coins, TrendingUp, Shield, Sparkles, Home, Youtube, Instagram, Linkedin, Calendar, Video } from 'lucide-react';

const SolanaAssistant = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "👋 🌟 Welcome to SMSai\n\nYour AI guide to the Solana ecosystem. We break things down simply—from wallets and seed phrases to staking, DeFi, RWAs, memecoins, and how Solana actually works under the hood.\n\nAsk me anything about Solana."
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [solPrice, setSolPrice] = useState(null);
  const [btcPrice, setBtcPrice] = useState(null);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    { icon: Wallet, text: 'How do wallets work?' },
    { icon: Shield, text: 'What is a seed phrase?' },
    { icon: TrendingUp, text: 'Explain DeFi and staking' },
    { icon: Coins, text: 'How do Solana memecoins work?' }
  ];

  const socialLinks = [
    { name: '@smsonx', url: 'https://x.com/smsonx', label: '@smsonx', icon: '𝕏' },
    { name: '@solmadesimple', url: 'https://x.com/solmadesimple', label: '@solmadesimple', icon: '𝕏' },
    { name: 'YouTube', url: 'https://www.youtube.com/@SMSONYOUTUBE', Icon: Youtube },
    { name: 'TikTok', url: 'https://www.tiktok.com/@solanamadesimple', Icon: Video, label: 'TikTok' },
    { name: 'Instagram', url: 'https://www.instagram.com/smscrypto', Icon: Instagram },
    { name: 'LinkedIn', url: 'https://www.linkedin.com/in/sean-suvie-77a35018b/', Icon: Linkedin },
    { name: 'Book a Call', url: 'https://calendly.com/seanmsuvie/30min', Icon: Calendar, label: 'Book a Call' }
  ];

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana,bitcoin&vs_currencies=usd&include_24hr_change=true');
        const data = await response.json();
        setSolPrice({
          price: data.solana.usd,
          change: data.solana.usd_24h_change
        });
        setBtcPrice({
          price: data.bitcoin.usd,
          change: data.bitcoin.usd_24h_change
        });
      } catch (error) {
        console.error('Failed to fetch prices:', error);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (promptText = null) => {
    const userMessage = promptText || input.trim();
    
    if (!userMessage || loading) return;

    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setMessages([...newMessages, { 
        role: 'assistant', 
        content: data.content 
      }]);
    } catch (error) {
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: "👋 🌟 Welcome to SMSai\n\nYour AI guide to the Solana ecosystem. We break things down simply—from wallets and seed phrases to staking, DeFi, RWAs, memecoins, and how Solana actually works under the hood.\n\nAsk me anything about Solana."
      }
    ]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      <div className="bg-black/60 backdrop-blur-md border-b border-purple-500/20 px-4 py-2.5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-4 sm:gap-6">
            {solPrice && (
              <div className="flex items-center gap-2">
                <span className="text-purple-300 font-semibold text-xs sm:text-sm">SOL</span>
                <span className="text-white font-bold text-xs sm:text-sm">${solPrice.price.toFixed(2)}</span>
                <span className={`text-xs ${solPrice.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {solPrice.change >= 0 ? '↑' : '↓'} {Math.abs(solPrice.change).toFixed(2)}%
                </span>
              </div>
            )}
            {btcPrice && (
              <div className="flex items-center gap-2">
                <span className="text-orange-300 font-semibold text-xs sm:text-sm">BTC</span>
                <span className="text-white font-bold text-xs sm:text-sm">${btcPrice.price.toLocaleString()}</span>
                <span className={`text-xs ${btcPrice.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {btcPrice.change >= 0 ? '↑' : '↓'} {Math.abs(btcPrice.change).toFixed(2)}%
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <span className="text-purple-300 text-xs font-semibold">Socials:</span>
            {socialLinks.map((link, idx) => (
              
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-purple-300 hover:text-white transition-all hover:scale-110"
                title={link.name}
              >
                {link.Icon ? (
                  <link.Icon className="w-4 h-4" />
                ) : link.icon ? (
                  <span className="text-sm font-bold">{link.icon}</span>
                ) : null}
                {link.label && (
                  <span className="text-xs font-medium">{link.label}</span>
                )}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-black/40 backdrop-blur-lg border-b border-purple-500/30 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Solana Made Simple</h1>
            <p className="text-sm text-purple-300">Your AI Guide to the Solana Ecosystem</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
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
            <div className="flex gap-3 justify-start">
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

      {messages.length === 1 && (
        <div className="px-4 pb-4">
          <div className="max-w-4xl mx-auto">
            <p className="text-purple-300 text-sm mb-3 text-center">Quick start topics:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSubmit(prompt.text)}
                  className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-105 transition-transform duration-200 text-white font-medium shadow-lg"
                >
                  <prompt.icon className="w-5 h-5" />
                  <span className="text-sm">{prompt.text}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-black/40 backdrop-blur-lg border-t border-purple-500/30 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Ask anything about Solana..."
              disabled={loading}
              className="flex-1 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl px-5 py-3 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            />
            {messages.length > 1 && (
              <button
                onClick={resetChat}
                className="bg-purple-600/50 hover:bg-purple-600 text-white rounded-xl px-4 py-3 font-medium transition-all flex items-center gap-2"
                title="Return to home"
              >
                <Home className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => handleSubmit()}
              disabled={loading || !input.trim()}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl px-6 py-3 font-medium hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
    </div>
  );
};

export default SolanaAssistant;
