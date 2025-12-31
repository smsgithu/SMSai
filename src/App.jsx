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
} from "lucide-react";

export default function App() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hey! Welcome to Solana Made Simple. I'm your AI guide to everything Solana. Whether you're just getting started with wallets and seed phrases, curious about DeFi and staking, or want to understand the memecoin phenomenon and RWA (Real World Assets), I'm here to help. What would you like to learn about today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const quickPrompts = [
    {
      icon: Wallet,
      text: "How do I create a Solana wallet?",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Shield,
      text: "What are seed phrases?",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: TrendingUp,
      text: "Explain DeFi and staking",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: Coins,
      text: "Tell me about Solana memecoins",
      color: "from-orange-500 to-red-500",
    },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (promptText = null) => {
    const userMessage = promptText || input.trim();
    if (!userMessage || loading) return;

    const newMessages = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // ⚠️ Move this to a serverless function before production
          // "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 800,
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();
      const assistantMessage =
        data?.content?.map((b) => b.text).join("\n") ||
        "Something went wrong. Please try again.";

      setMessages([...newMessages, { role: "assistant", content: assistantMessage }]);
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content:
            "I'm having trouble connecting right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/40 backdrop-blur-xl border-b border-purple-500/30 shadow-lg shadow-purple-900/20">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Solana Made Simple</h1>
            <p className="text-sm text-purple-300">
              Your AI Guide to the Solana Ecosystem
            </p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
              )}
              <div
                className={`max-w-2xl rounded-2xl px-5 py-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                  msg.role === "user"
                    ? "bg-gradient-to-r from-purple-600 to-pink-600"
                    : "bg-white/10 backdrop-blur-lg border border-white/20"
                }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl px-5 py-3 border border-white/20">
                <Loader2 className="w-5 h-5 animate-spin text-purple-300" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Quick prompts */}
      {messages.length === 1 && (
        <section className="px-4 pb-4">
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickPrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSubmit(p.text)}
                className={`flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r ${p.color}
                  text-white font-medium shadow-lg transition-all duration-200
                  hover:scale-[1.03] hover:shadow-2xl hover:brightness-110
                  active:scale-[0.98]`}
              >
                <p.icon className="w-5 h-5" />
                <span>{p.text}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Input */}
      <footer className="bg-black/40 backdrop-blur-xl border-t border-purple-500/30 px-4 py-4 shadow-[0_-10px_30px_-10px_rgba(168,85,247,0.25)]">
        <div className="max-w-4xl mx-auto flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about Solana..."
            disabled={loading}
            className="flex-1 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl px-5 py-3 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
          />
          <button
            onClick={() => handleSubmit()}
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl px-6 py-3 font-medium transition-all hover:brightness-110 disabled:opacity-50 flex items-center"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
