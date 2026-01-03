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
  Home,
  Youtube,
  Instagram,
  Linkedin,
  Calendar,
  Video,
  Eye
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const INITIAL_MESSAGE = {
  role: 'assistant',
  content:
    "👋 🌟 Welcome to SMSai\n\nYour AI guide to the Solana ecosystem. We break things down simply—from wallets and seed phrases to staking, DeFi, RWAs, memecoins, and how Solana actually works under the hood.\n\nAsk me anything about Solana.",
  timestamp: new Date()
};

export default function SolanaAssistant() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [solPrice, setSolPrice] = useState(null);
  const [btcPrice, setBtcPrice] = useState(null);
  const [sessionCount, setSessionCount] = useState(0);

  const messagesEndRef = useRef(null);
  const hasTrackedSession = useRef(false);

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

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

  /* Track sessions */
  useEffect(() => {
    if (!hasTrackedSession.current) {
      hasTrackedSession.current = true;
      const count = Number(localStorage.getItem('smsai_sessions') || 0) + 1;
      localStorage.setItem('smsai_sessions', count);
      setSessionCount(count);
    }
  }, []);

  /* Prices */
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=solana,bitcoin&vs_currencies=usd&include_24hr_change=true'
        );
        const data = await res.json();
        setSolPrice({ price: data.solana.usd, change: data.solana.usd_24h_change });
        setBtcPrice({ price: data.bitcoin.usd, change: data.bitcoin.usd_24h_change });
      } catch {}
    };
    fetchPrices();
    const i = setInterval(fetchPrices, 300000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (text = null) => {
    const content = text || input.trim();
    if (!content || loading) return;

    const updated = [...messages, { role: 'user', content, timestamp: new Date() }];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated.slice(-10).map(m => ({ role: m.role, content: m.content }))
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error();

      setMessages([...updated, {
        role: 'assistant',
        content: data.content,
        timestamp: new Date()
      }]);
    } catch {
      setMessages([...updated, {
        role: 'assistant',
        content: 'I’m having trouble connecting right now. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const resetChat = () => setMessages([INITIAL_MESSAGE]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">

      {/* TOP BAR */}
      <div className="bg-black/60 border-b border-purple-500/20 px-4 py-2">
        <div className="max-w-6xl mx-auto flex justify-between items-center flex-wrap gap-3">
          <div className="flex items-center gap-4">
            {solPrice && (
              <span className="text-purple-300 text-sm">
                SOL ${solPrice.price.toFixed(2)}
              </span>
            )}
            {btcPrice && (
              <span className="text-orange-300 text-sm">
                BTC ${btcPrice.price.toLocaleString()}
              </span>
            )}
            <span className="flex items-center gap-1 text-purple-300/60 text-xs">
              <Eye className="w-3 h-3" /> {sessionCount}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {socialLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-300 hover:text-white flex items-center gap-1"
              >
                {link.Icon ? <link.Icon className="w-4 h-4" /> : <span>{link.icon}</span>}
                {link.label && <span className="text-xs">{link.label}</span>}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* HEADER */}
      <div className="bg-black/40 border-b border-purple-500/30 px-6 py-4">
        <div className="max-w-4xl mx-auto flex gap-3 items-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Solana Made Simple</h1>
            <p className="text-sm text-purple-300">Your AI Guide to the Solana Ecosystem</p>
          </div>
        </div>
      </div>

      {/* CHAT */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[85%] bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
                <div className="text-xs text-purple-300/60 mt-1">
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            </div>
          ))}
          {loading && <Loader2 className="animate-spin text-purple-300" />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* INPUT */}
      <div className="bg-black/40 border-t border-purple-500/30 px-4 py-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
            placeholder="Ask anything about Solana..."
          />
          {messages.length > 1 && (
            <button onClick={resetChat} className="bg-purple-600/50 px-4 rounded-xl">
              <Home className="w-5 h-5 text-white" />
            </button>
          )}
          <button onClick={() => handleSubmit()} className="bg-gradient-to-r from-purple-600 to-pink-600 px-5 rounded-xl">
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
