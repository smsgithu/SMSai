import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, BookOpen, Wallet, Coins, TrendingUp, Shield, Sparkles, Home, Youtube, Instagram, Linkedin, Calendar, Video, Eye, LogOut, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const SolanaAssistant = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "👋 🌟 Welcome to SMSai\n\nYour AI guide to the Solana ecosystem. We break things down simply—from wallets and seed phrases to staking, DeFi, RWAs, memecoins, and how Solana actually works under the hood.\n\nAsk me anything about Solana.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [solPrice, setSolPrice] = useState(null);
  const [btcPrice, setBtcPrice] = useState(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletType, setWalletType] = useState('');
  const [userXP, setUserXP] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [showWalletPrompt, setShowWalletPrompt] = useState(false);
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

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const shortenAddress = (address) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // Track page views
  useEffect(() => {
    if (!hasTrackedSession.current) {
      hasTrackedSession.current = true;
      
      const currentCount = parseInt(localStorage.getItem('smsai_sessions') || '0');
      const newCount = currentCount + 1;
      localStorage.setItem('smsai_sessions', newCount.toString());
      setSessionCount(newCount);

      // Check if wallet already connected
      const savedWallet = localStorage.getItem('smsai_wallet');
      const savedWalletType = localStorage.getItem('smsai_wallet_type');
      const savedXP = parseInt(localStorage.getItem('smsai_xp') || '0');
      const savedQuestions = parseInt(localStorage.getItem('smsai_questions') || '0');
      
      if (savedWallet) {
        setWalletConnected(true);
        setWalletAddress(savedWallet);
        setWalletType(savedWalletType || 'unknown');
        setUserXP(savedXP);
        setQuestionCount(savedQuestions);
      }
    }
  }, []);

  // Fetch crypto prices - 5 minutes
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
    const interval = setInterval(fetchPrices, 300000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const connectWallet = async (walletName) => {
    try {
      let wallet;
      let provider;

      if (walletName === 'solflare') {
        wallet = window.solflare;
        if (!wallet) {
          window.open('https://solflare.com/', '_blank');
          alert('Please install Solflare wallet! Visit solflare.com');
          return;
        }
        provider = 'solflare';
      } else if (walletName === 'jupiter') {
        // Jupiter mobile wallet
        wallet = window.jupiter;
        if (!wallet) {
          // Check if on mobile
          const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
          if (isMobile) {
            window.open('https://jup.ag/mobile', '_blank');
            alert('Please install Jupiter Mobile wallet!');
          } else {
            alert('Jupiter Mobile is available on mobile devices. Use Solflare or Phantom on desktop.');
          }
          return;
        }
        provider = 'jupiter';
      } else {
        // Phantom
        wallet = window.solana;
        if (!wallet?.isPhantom) {
          window.open('https://phantom.app/', '_blank');
          alert('Please install Phantom wallet! Visit phantom.app');
          return;
        }
        provider = 'phantom';
      }

      // Connect to wallet
      const response = await wallet.connect();
      const address = response.publicKey.toString();
      
      setWalletAddress(address);
      setWalletConnected(true);
      setWalletType(provider);
      setShowWalletPrompt(false);
      
      // Award connection XP
      const newXP = userXP + 20;
      setUserXP(newXP);
      
      // Save to localStorage
      localStorage.setItem('smsai_wallet', address);
      localStorage.setItem('smsai_wallet_type', provider);
      localStorage.setItem('smsai_xp', newXP.toString());
      
      // Optional: Send to backend API
      fetch('/api/auth/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          wallet_address: address,
          wallet_type: provider,
          timestamp: new Date() 
        })
      }).catch(() => {});
      
    } catch (error) {
      console.error('Wallet connection failed:', error);
      alert('Wallet connection was cancelled or failed. Please try again.');
    }
  };

  const disconnectWallet = () => {
    setWalletConnected(false);
    setWalletAddress('');
    setWalletType('');
    setUserXP(0);
    localStorage.removeItem('smsai_wallet');
    localStorage.removeItem('smsai_wallet_type');
    localStorage.removeItem('smsai_xp');
  };

  const handleSubmit = async (promptText = null) => {
    const userMessage = promptText || input.trim();
    
    if (!userMessage || loading) return;

    // Check if user needs to connect wallet
    if (!walletConnected && questionCount >= 5) {
      setShowWalletPrompt(true);
      return;
    }

    const newMessages = [...messages, { role: 'user', content: userMessage, timestamp: new Date() }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    // Increment question count and XP
    const newQuestionCount = questionCount + 1;
    setQuestionCount(newQuestionCount);
    localStorage.setItem('smsai_questions', newQuestionCount.toString());
    
    if (walletConnected) {
      const newXP = userXP + 5;
      setUserXP(newXP);
      localStorage.setItem('smsai_xp', newXP.toString());
    }

    try {
      const recentMessages = newMessages.slice(-10);
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: recentMessages.map(m => ({ role: m.role, content: m.content })),
          wallet_address: walletAddress || null
        })
      });

      const data = await response.json();
      
      if (!response.ok || data.error) {
        throw new Error(data.error || 'API request failed');
      }

      const content = data.content || "I received your message but couldn't generate a response. Please try again.";

      setMessages([...newMessages, { 
        role: 'assistant', 
        content: content,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: "👋 🌟 Welcome to SMSai\n\nYour AI guide to the Solana ecosystem. We break things down simply—from wallets and seed phrases to staking, DeFi, RWAs, memecoins, and how Solana actually works under the hood.\n\nAsk me anything about Solana.",
        timestamp: new Date()
      }
    ]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      {/* Wallet Connect Prompt Modal */}
      {showWalletPrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-gradient-to-br from-slate-900 to-purple-900 border border-purple-500/30 rounded-2xl p-8 max-w-md w-full">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Connect Your Wallet</h2>
              <p className="text-purple-200 mb-6">
                You've asked 5 questions! Connect your Solana wallet to continue learning for free, track your progress, and earn XP.
              </p>
              <p className="text-sm text-purple-300 mb-4">Choose your preferred wallet:</p>
              <div className="space-y-3">
                <button
                  onClick={() => connectWallet('solflare')}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl px-6 py-4 font-semibold hover:from-purple-500 hover:to-pink-500 transition-all flex items-center justify-center gap-2"
                >
                  <Wallet className="w-5 h-5" />
                  Solflare
                </button>
                <button
                  onClick={() => connectWallet('phantom')}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl px-6 py-4 font-semibold hover:from-indigo-500 hover:to-purple-500 transition-all flex items-center justify-center gap-2"
                >
                  <Wallet className="w-5 h-5" />
                  Phantom
                </button>
                <button
                  onClick={() => connectWallet('jupiter')}
                  className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl px-6 py-4 font-semibold hover:from-green-500 hover:to-teal-500 transition-all flex items-center justify-center gap-2"
                >
                  <Wallet className="w-5 h-5" />
                  Jupiter Mobile
                </button>
                <button
                  onClick={() => setShowWalletPrompt(false)}
                  className="w-full bg-white/10 text-purple-200 rounded-xl px-6 py-3 font-medium hover:bg-white/20 transition-all"
                >
                  Maybe Later
                </button>
              </div>
              <p className="text-xs text-purple-300/60 mt-4">
                100% free • No transactions • Just sign-in
              </p>
            </div>
          </div>
        </div>
      )}

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
            {walletConnected ? (
              <div className="flex items-center gap-2 bg-gradient-to-r from-purple-600/30 to-pink-600/30 px-3 py-1.5 rounded-full border border-purple-500/30">
                <User className="w-3.5 h-3.5 text-purple-300" />
                <span className="text-xs text-white font-medium">{shortenAddress(walletAddress)}</span>
                <span className="text-xs text-purple-300">• {userXP} XP</span>
                <button
                  onClick={disconnectWallet}
                  className="ml-1 text-purple-300 hover:text-white transition-colors"
                  title="Disconnect"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowWalletPrompt(true)}
                className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-3 py-1.5 rounded-full text-xs font-semibold text-white transition-all"
              >
                <Wallet className="w-3.5 h-3.5" />
                Connect Wallet
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <span className="text-purple-300 text-xs font-semibold">Socials:</span>
            {socialLinks.map((link, idx) => (
              <a
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
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Solana Made Simple</h1>
              <p className="text-sm text-purple-300">Your AI Guide to the Solana Ecosystem</p>
            </div>
          </div>
          {!walletConnected && questionCount > 0 && (
            <div className="hidden sm:block text-sm text-purple-300/80">
              {5 - questionCount} free questions left
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className={`flex items-end gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 mb-1">
                    <BookOpen className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-sm'
                      : 'bg-white/10 backdrop-blur-lg text-white border border-white/20 rounded-bl-sm'
                  }`}
                >
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        p: ({children}) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                        h1: ({children}) => <h1 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h1>,
                        h2: ({children}) => <h2 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h2>,
                        h3: ({children}) => <h3 className="text-sm font-bold mb-1 mt-2 first:mt-0">{children}</h3>,
                        ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                        li: ({children}) => <li className="leading-relaxed">{children}</li>,
                        strong: ({children}) => <strong className="font-semibold text-purple-200">{children}</strong>,
                        em: ({children}) => <em className="italic text-purple-200">{children}</em>,
                        code: ({children}) => <code className="bg-black/30 px-1.5 py-0.5 rounded text-xs">{children}</code>,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
              <span className={`text-xs text-purple-300/60 mt-1 ${msg.role === 'user' ? 'mr-9' : 'ml-9'}`}>
                {formatTime(msg.timestamp)}
              </span>
            </div>
          ))}
          
          {loading && (
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl rounded-bl-sm px-4 py-3 border border-white/20">
                <Loader2 className="w-5 h-5 text-purple-300 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {messages.length === 1 && (
        <div className="px-4 pb-4">
          <div className="max-w-3xl mx-auto">
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
        <div className="max-w-3xl mx-auto">
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
