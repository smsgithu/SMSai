import React, { useState, useRef, useEffect } from "react";
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
} from "lucide-react";

const INITIAL_MESSAGE = {
  role: "assistant",
  content:
    "Hey! Welcome to Solana Made Simple. This app is running in demo mode, but everything here is based on real Solana fundamentals and real ecosystem experience. What would you like to learn?",
};

export default function App() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const quickPrompts = [
    { icon: Wallet, text: "How do I create a Solana wallet?", color: "from-purple-500 to-pink-500" },
    { icon: Shield, text: "How do I avoid scams on Solana?", color: "from-red-500 to-orange-500" },
    { icon: TrendingUp, text: "What is staking SOL?", color: "from-green-500 to-emerald-500" },
    { icon: Coins, text: "What is liquid staking and mSOL?", color: "from-blue-500 to-cyan-500" },
    { icon: BookOpen, text: "What is Solana and why is it fast?", color: "from-indigo-500 to-purple-500" },
    { icon: Sparkles, text: "What is Bitcoin on Solana (BTCFi)?", color: "from-yellow-500 to-orange-500" },
  ];

  const demoResponses = {
    wallet: `To create a Solana wallet, most users start with Phantom or Solflare.

Your wallet is your on-chain identity. When you create one, you receive a seed phrase. That phrase controls access to your funds and must be stored offline and kept private.`,

    seed: `A seed phrase (recovery phrase) is a list of words that can fully restore your wallet.

Anyone with this phrase controls your funds. No legitimate project, admin, or support agent will ever ask for it.`,

    solana: `Solana is a high-performance blockchain built for speed and low fees.

It uses a system called Proof of History to efficiently order transactions, allowing DeFi, NFTs, and payments to run at scale.`,

    validators: `Validators are independent computers that secure the Solana network.

When you stake SOL, you delegate to validators. This helps decentralize the network while earning staking rewards.`,

    staking: `Staking SOL means delegating your tokens to help secure Solana.

Your SOL stays in your wallet. You earn yield from network inflation and fees while supporting decentralization.`,

    liquidStaking: `Liquid staking lets you stake SOL while keeping it usable.

Protocols like Marinade issue mSOL, which represents your staked SOL plus rewards and can be used across DeFi.`,

    btcfi: `Bitcoin on Solana (often called BTCFi) allows BTC to move, earn yield, and be used in fast, low-cost DeFi environments.

This unlocks new utility for Bitcoin beyond just holding.`,

    rwa: `Real World Assets (RWAs) are real assets like treasuries, equities, or real estate represented on-chain.

Solana’s speed and low fees make it well-suited for tokenized real-world markets.`,

    institutions: `Institutions are engaging with Solana through staking, validators, and tokenized assets.

This signals long-term confidence beyond speculation and memes.`,

    safety: `Most losses in crypto come from user error, not protocol hacks.

Common mistakes include sharing seed phrases, clicking fake links, approving malicious transactions, and chasing hype without understanding risk.`,

    memecoin: `Memecoins on Solana are fast, social, and cheap to trade.

Some gain traction, many disappear. Treat them as high-risk experiments, not long-term investments.`,
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const resetChat = () => {
    setMessages([INITIAL_MESSAGE]);
    setInput("");
  };

  const handleSubmit = async (promptText = null) => {
    const userMessage = promptText || input.trim();
    if (!userMessage || loading) return;

    const newMessages = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    await new Promise((res) => setTimeout(res, 800));

    const lower = userMessage.toLowerCase();
    let response = demoResponses.solana;

    if (lower.includes("wallet")) response = demoResponses.wallet;
    if (lower.includes("seed") || lower.includes("phrase")) response = demoResponses.seed;
    if (lower.includes("stake")) response = demoResponses.staking;
    if (lower.includes("liquid") || lower.includes("msol")) response = demoResponses.liquidStaking;
    if (lower.includes("validator")) response = demoResponses.validators;
    if (lower.includes("bitcoin") || lower.includes("btc")) response = demoResponses.btcfi;
    if (lower.includes("rwa")) response = demoResponses.rwa;
    if (lower.includes("institution")) response = demoResponses.institutions;
    if (lower.includes("scam") || lower.includes("safe")) response = demoResponses.safety;
    if (lower.includes("meme")) response = demoResponses.memecoin;

    setMessages([...newMessages, { role: "assistant", content: response }]);
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <header className="sticky top-0 z-50 bg-black/40 backdrop-blur-xl border-b border-purple-500/30">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Solana Made Simple</h1>
              <p className="text-sm text-purple-300">Demo Mode · Education First</p>
            </div>
          </div>
          <button
            onClick={resetChat}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
          >
            <Home size={18} />
            New Chat
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
              )}
              <div className={`max-w-2xl rounded-2xl px-5 py-3 ${msg.role === "user" ? "bg-gradient-to-r from-purple-600 to-pink-600" : "bg-white/10 border border-white/20"}`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-purple-300" />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {messages.length === 1 && (
        <section className="px-4 pb-4">
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickPrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSubmit(p.text)}
                className={`flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r ${p.color} text-white font-medium hover:scale-[1.03] transition`}
              >
                <p.icon className="w-5 h-5" />
                <span>{p.text}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <footer className="bg-black/40 border-t border-purple-500/30 px-4 py-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about Solana…"
            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-5 py-3 text-white placeholder-purple-300"
          />
          <button
            onClick={() => handleSubmit()}
            disabled={!input.trim() || loading}
            className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 rounded-xl font-medium"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </footer>
    </div>
  );
}
