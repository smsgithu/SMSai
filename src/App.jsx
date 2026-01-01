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
    "GM 👋 Welcome to Solana Made Simple.\n\nThis is a demo version of the SMS AI — an educational guide built to help you understand Solana from zero to power user.\n\nAsk about wallets, seed phrases, staking, DeFi, memecoins, RWAs, or how the Solana ecosystem actually works.\n\nNo hype. Just clarity. What do you want to learn?"
};

const DEMO_RESPONSES = {
  wallet:
    "A Solana wallet is your on-chain identity. It lets you hold SOL and tokens, interact with apps, and sign transactions. Popular wallets include Phantom and Solflare.\n\nYour wallet has a public address (safe to share) and a seed phrase (never share).",
  seed:
    "A seed phrase is a 12 or 24 word master key to your wallet. Anyone with it can access your funds.\n\nWrite it down offline. Never screenshot it. Never paste it into a website. No legit app will ever ask for it.",
  defi:
    "DeFi stands for Decentralized Finance. On Solana, this includes staking, lending, trading, and yield strategies — all powered by smart contracts instead of banks.\n\nStaking SOL helps secure the network and earns rewards.",
  memecoins:
    "Memecoins on Solana are fast-moving, high-risk culture assets. Some are experiments, some are jokes, some build real communities.\n\nMost fail. Never risk money you can’t afford to lose."
};

const SolanaAssistant = () => {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    { icon: Wallet, text: 'How do wallets work?' },
    { icon: Shield, text: 'What is a seed phrase?' },
    { icon: TrendingUp, text: 'What is DeFi and staking?' },
    { icon: Coins, text: 'Are Solana memecoins risky?' }
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const resetChat = () => {
    setMessages([WELCOME_MESSAGE]);
    setInput('');
    setLoading(false);
  };

  const getDemoResponse = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes('wallet')) return DEMO_RESPONSES.wallet;
    if (lower.includes('seed')) return DEMO_RESPONSES.seed;
    if (lower.includes('defi') || lower.includes('stake')) return DEMO_RESPONSES.defi;
    if (lower.includes('meme')) return DEMO_RESPONSES.memecoins;

    return "That’s a great topic — this demo version is still loading knowledge modules.\n\nMore responses and live AI are coming soon 👀";
  };

  const handleSubmit = async (promptText = null) => {
    const userMessage = promptText || input.trim();
    if (!userMessage || loading) return;

    const updatedMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    setTimeout(() => {
      const reply = getDemoResponse(userMessage);
      setMessages([...updatedMessages, { role: 'assistant', content: reply }]);
      setLoading(false);
    }, 600);
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
              <h1 className="text-xl font-bold text-white">Solana Made Simple</h1>
              <p className="text-sm text-purple-300">SMS AI · Demo Mode</p>
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
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-2xl px-5 py-3 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-white/10 border border-white/20 text-white'
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && <Loader2 className="w-5 h-5 text-purple-300 animate-spin" />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick prompts */}
      {messages.length === 1 && (
        <div className="px-4 pb-4 max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSubmit(p.text)}
              className="flex items-center gap-3 p-4 rounded-xl bg-purple-700 text-white hover:bg-purple-600"
            >
              <p.icon className="w-5 h-5" />
              {p.text}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="bg-black/40 border-t border-purple-500/30 px-4 py-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about Solana…"
            className="flex-1 rounded-xl px-5 py-3 bg-white/10 text-white"
          />
          <button
            onClick={() => handleSubmit()}
            className="bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-3 rounded-xl text-white"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SolanaAssistant;
