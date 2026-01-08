import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Wallet, Sparkles, Send, Home, User, LogOut, Loader2, Twitter, Youtube, Video, Instagram, Linkedin, Calendar } from 'lucide-react';

function App() {
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
  const [smsPrice, setSmsPrice] = useState(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletType, setWalletType] = useState('');
  const [userXP, setUserXP] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [showWalletPrompt, setShowWalletPrompt] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState('');
  const messagesEndRef = useRef(null);
  const hasTrackedSession = useRef(false);

  const walletOptions = [
    { id: 'phantom', name: 'Phantom', window: 'solana', check: (w) => w?.isPhantom },
    { id: 'solflare', name: 'Solflare', window: 'solflare', check: (w) => !!w },
    { id: 'backpack', name: 'Backpack', window: 'backpack', check: (w) => w?.isBackpack || (w && typeof w.connect === 'function') },
    { id: 'jupiter', name: 'Jupiter', window: 'jupiter', check: (w) => !!w },
    { id: 'glow', name: 'Glow', window: 'glow', check: (w) => !!w },
    { id: 'coinbase', name: 'Coinbase Wallet', window: 'coinbaseSolana', check: (w) => !!w },
  ];

  const syncUserData = async (walletAddr, updates = {}) => {
    try {
      const payload = {
        wallet_address: walletAddr,
        wallet_type: updates.wallet_type || walletType || 'unknown',
        xp: updates.xp !== undefined ? updates.xp : userXP,
        questions_asked: updates.questions_asked !== undefined ? updates.questions_asked : questionCount
      };

      const response = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`);
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Sync error:', error);
      throw error;
    }
  };

  const loadUserData = async (walletAddr) => {
    try {
      const response = await fetch(`/api/user?wallet_address=${walletAddr}`);
      
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Load failed: ${response.status}`);
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Load error:', error);
      return null;
    }
  };

  const socialLinks = [
    { name: 'X (SMS)', url: 'https://x.com/smsonx', Icon: Twitter, label: '@smsonx' },
    { name: 'X (SolMadeSimple)', url: 'https://x.com/solmadesimple', Icon: Twitter, label: '@solmadesimple' },
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

  useEffect(() => {
    if (!hasTrackedSession.current) {
      hasTrackedSession.current = true;
      
      const currentCount = parseInt(localStorage.getItem('smsai_sessions') || '0');
      const newCount = currentCount + 1;
      localStorage.setItem('smsai_sessions', newCount.toString());
      setSessionCount(newCount);

      const savedWallet = localStorage.getItem('smsai_wallet');
      const savedWalletType = localStorage.getItem('smsai_wallet_type');
      
      if (savedWallet) {
        loadUserData(savedWallet).then(userData => {
          if (userData) {
            setWalletAddress(savedWallet);
            setWalletType(savedWalletType || 'unknown');
            setWalletConnected(true);
            setUserXP(userData.xp || 0);
            setQuestionCount(userData.questions_asked || 0);
          } else {
            localStorage.removeItem('smsai_wallet');
            localStorage.removeItem('smsai_wallet_type');
          }
        });
      }
    }
  }, []);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const cgResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana,bitcoin&vs_currencies=usd&include_24hr_change=true');
        const cgData = await cgResponse.json();
        
        setSolPrice({
          price: cgData.solana.usd,
          change: cgData.solana.usd_24h_change
        });
        setBtcPrice({
          price: cgData.bitcoin.usd,
          change: cgData.bitcoin.usd_24h_change
        });

        const smsContract = 'A9FmiDpt5UMwuvJgR759RJMEHdXzwwymyisMNfxvBAGS';
        const dexResponse = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${smsContract}`);
        const dexData = await dexResponse.json();
        
        if (dexData.pairs && dexData.pairs.length > 0) {
          const mainPair = dexData.pairs[0];
          setSmsPrice({
            price: parseFloat(mainPair.priceUsd),
            change: parseFloat(mainPair.priceChange?.h24 || 0)
          });
        }
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
      const walletConfig = walletOptions.find(w => w.id === walletName);
      
      if (!walletConfig) {
        alert('Unknown wallet type.');
        return;
      }

      const walletObj = window[walletConfig.window];

      if (!walletObj || !walletConfig.check(walletObj)) {
        const downloadUrls = {
          phantom: 'https://phantom.app/',
          solflare: 'https://solflare.com/',
          backpack: 'https://backpack.app/',
          jupiter: 'https://jup.ag/',
          glow: 'https://glow.app/',
          coinbase: 'https://www.coinbase.com/wallet'
        };
        
        window.open(downloadUrls[walletName] || 'https://solana.com/ecosystem/explore?categories=wallet', '_blank');
        alert(`${walletConfig.name} not detected.\n\n1. Install from the opened page\n2. Refresh this page\n3. Try again`);
        return;
      }

      const response = await walletObj.connect();
      
      let publicKey;
      if (walletName === 'solflare') {
        publicKey = walletObj.publicKey || response?.publicKey;
      } else if (response?.publicKey) {
        publicKey = response.publicKey;
      } else if (walletObj.publicKey) {
        publicKey = walletObj.publicKey;
      } else {
        throw new Error('Could not find public key');
      }
      
      const address = typeof publicKey === 'string' ? publicKey : publicKey.toString();
      
      const userData = await loadUserData(address);
      
      let newXP = 0;
      let newQuestionCount = 0;
      let message = '';
      
      if (userData) {
        newXP = userData.xp || 0;
        newQuestionCount = userData.questions_asked || 0;
        message = `Welcome back! You have ${newXP} XP`;
      } else {
        newXP = 20;
        newQuestionCount = 0;
        
        try {
          await syncUserData(address, {
            wallet_type: walletName,
            xp: 20,
            questions_asked: 0
          });
          message = 'Wallet connected! +20 XP welcome bonus';
        } catch (error) {
          alert('Connected but failed to save to database. You may need to reconnect.');
          return;
        }
      }
      
      setWalletAddress(address);
      setWalletConnected(true);
      setWalletType(walletName);
      setUserXP(newXP);
      setQuestionCount(newQuestionCount);
      setShowWalletPrompt(false);
      
      localStorage.setItem('smsai_wallet', address);
      localStorage.setItem('smsai_wallet_type', walletName);
      
      setConnectionMessage(message);
      setTimeout(() => setConnectionMessage(''), 5000);
      
    } catch (error) {
      if (error.message?.includes('User rejected')) {
        alert('Connection cancelled.');
      } else if (error.code === 4001) {
        alert('Connection rejected. Please approve in your wallet.');
      } else {
        alert(`Connection failed: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const disconnectWallet = () => {
    setWalletConnected(false);
    setWalletAddress('');
    setWalletType('');
    setUserXP(0);
    setQuestionCount(0);
    localStorage.removeItem('smsai_wallet');
    localStorage.removeItem('smsai_wallet_type');
  };

  const handleSubmit = async (promptText = null) => {
    const userMessage = promptText || input.trim();

    if (!userMessage || loading) return;

    if (!walletConnected && questionCount >= 5) {
      setShowWalletPrompt(true);
      return;
    }

    const newMessages = [...messages, { role: 'user', content: userMessage, timestamp: new Date() }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    const newQuestionCount = questionCount + 1;
    setQuestionCount(newQuestionCount);

    if (walletConnected && walletAddress) {
      const newXP = userXP + 5;
      setUserXP(newXP);

      syncUserData(walletAddress, {
        xp: newXP,
        questions_asked: newQuestionCount,
      }).catch(() => {});
    }

    const assistantMessageIndex = newMessages.length;
    setMessages([...newMessages, { role: 'assistant', content: '', timestamp: new Date() }]);

    try {
      const recentMessages = newMessages.slice(-10);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: recentMessages.map((m) => ({ role: m.role, content: m.content })),
          wallet_address: walletAddress || null,
        }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                fullContent += parsed.delta.text;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[assistantMessageIndex] = {
                    role: 'assistant',
                    content: fullContent,
                    timestamp: new Date(),
                  };
                  return updated;
                });
              }
            } catch (e) {}
          }
        }
      }

      if (!fullContent) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[assistantMessageIndex] = {
            role: 'assistant',
            content: "I received your message but couldn't generate a response. Please try again.",
            timestamp: new Date(),
          };
          return updated;
        });
      }
    } catch (error) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[assistantMessageIndex] = {
          role: 'assistant',
          content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
          timestamp: new Date(),
        };
        return updated;
      });
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
      {connectionMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-green-600/30 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-lg border border-green-400/50 flex items-center gap-3 relative">
            <span className="text-2xl">🎉</span>
            <span className="font-semibold">{connectionMessage}</span>
            <button
              onClick={() => setConnectionMessage('')}
              className="ml-2 text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {showWalletPrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4 py-8">
          <div className="bg-gradient-to-br from-slate-900 to-purple-900 border border-purple-500/30 rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setShowWalletPrompt(false)}
              className="absolute top-4 right-4 text-purple-300 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Connect or Create Wallet</h2>
              <p className="text-purple-200 mb-4">
                You've explored 5 questions! 🎉 To keep learning about Solana, Web3, and crypto, connect your wallet.
              </p>
              <p className="text-sm text-purple-300/80 mb-6">
                It's 100% free, takes 30 seconds, and unlocks unlimited questions + XP rewards.
              </p>
              
              <div className="bg-purple-800/30 border border-purple-500/20 rounded-xl p-4 mb-6">
                <p className="text-sm text-white font-medium mb-3">Already have a wallet? Select it below:</p>
                <div className="space-y-2">
                  {walletOptions.map((wallet) => (
                    <button
                      key={wallet.id}
                      onClick={() => connectWallet(wallet.id)}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl px-6 py-3 font-semibold hover:from-purple-500 hover:to-pink-500 transition-all flex items-center justify-center gap-2"
                    >
                      <Wallet className="w-5 h-5" />
                      {wallet.name}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-purple-500/30"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-gradient-to-br from-slate-900 to-purple-900 px-3 text-purple-300">
                    Need to create a wallet? Follow this simple guide
                  </span>
                </div>
              </div>
              
              <div className="bg-purple-900/30 border border-purple-500/30 rounded-xl p-4">
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Create Your First Wallet (2 minutes)
                </h3>
                <p className="text-sm text-purple-200 mb-3">
                  New to Solana? Create a free wallet in 2 minutes:
                </p>
                <ol className="text-sm text-purple-200 space-y-2 mb-3">
                  <li className="flex gap-2">
                    <span className="font-bold text-purple-400">1.</span>
                    <span>Click any wallet above to visit their website</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-purple-400">2.</span>
                    <span>Install the browser extension or mobile app</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-purple-400">3.</span>
                    <span>Create a new wallet (takes 30 seconds)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-purple-400">4.</span>
                    <span>Save your seed phrase securely (never share it!)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-purple-400">5.</span>
                    <span>Refresh this page and connect</span>
                  </li>
                </ol>
                <p className="text-xs text-purple-300/80 italic">
                  💡 Your wallet is free, requires no personal info, and you don't need any crypto to create it.
                </p>
              </div>
              
              <button
                onClick={() => setShowWalletPrompt(false)}
                className="w-full bg-white/10 text-purple-200 rounded-xl px-6 py-3 font-medium hover:bg-white/20 transition-all mt-4"
              >
                Maybe Later
              </button>
              
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
            {smsPrice && (
              <div className="flex items-center gap-2">
                
                  href="https://jup.ag/tokens/A9FmiDpt5UMwuvJgR759RJMEHdXzwwymyisMNfxvBAGS"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-400 font-semibold text-xs sm:text-sm hover:text-pink-300 transition-colors"
                >
                  $SMS
                </a>
                <span className="text-white font-bold text-xs sm:text-sm">
                  ${smsPrice.price < 0.01 ? smsPrice.price.toFixed(6) : smsPrice.price.toFixed(4)}
                </span>
                {smsPrice.change !== 0 && (
                  <span className={`text-xs ${smsPrice.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {smsPrice.change >= 0 ? '↑' : '↓'} {Math.abs(smsPrice.change).toFixed(2)}%
                  </span>
                )}
                
                  href="https://jup.ag/tokens/A9FmiDpt5UMwuvJgR759RJMEHdXzwwymyisMNfxvBAGS"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 bg-gradient-to-r from-pink-600 to-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold hover:from-pink-500 hover:to-purple-500 transition-all"
                >
                  Buy
                </a>
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
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold hover:from-purple-500 hover:to-pink-500 transition-all flex items-center gap-2"
              >
                <Wallet className="w-3.5 h-3.5" />
                Connect Wallet
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-purple-300 text-xs">Socials:</span>
            {socialLinks.map((link) => (
              
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-300 hover:text-white transition-colors"
                title={link.label || link.name}
              >
                <link.Icon className="w-3.5 h-3.5" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center px-4 pt-8 pb-4 overflow-y-auto">
        <div className="w-full max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Solana Made Simple</h1>
              <p className="text-sm text-purple-300">Your AI Guide to the Solana Ecosystem</p>
            </div>
            <div className="ml-auto flex flex-col items-end gap-2">
              <div className="text-xs text-purple-300">👁️ {sessionCount} visits</div>
              
                href="https://jup.ag/tokens/A9FmiDpt5UMwuvJgR759RJMEHdXzwwymyisMNfxvBAGS"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-black/40 border border-pink-500/30 px-3 py-1.5 rounded-full hover:border-pink-500/50 hover:bg-black/60 transition-all group"
                title="View $SMS on Jupiter"
              >
                <span className="text-[10px] text-purple-300">Powered by</span>
                <img 
                  src="/sms.png" 
                  alt="$SMS" 
                  className="h-5 w-auto"
                />
              </a>
            </div>
          </div>

          {messages.length === 1 && (
            <div className="mb-6">
              <p className="text-sm text-purple-300 mb-3 text-center">Quick start topics:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => handleSubmit('How do wallets work?')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-500 hover:to-pink-500 transition-all text-left flex items-center gap-3"
                >
                  <Wallet className="w-5 h-5" />
                  How do wallets work?
                </button>
                <button
                  onClick={() => handleSubmit('What is a seed phrase?')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-500 hover:to-pink-500 transition-all text-left flex items-center gap-3"
                >
                  <Sparkles className="w-5 h-5" />
                  What is a seed phrase?
                </button>
                <button
                  onClick={() => handleSubmit('Explain DeFi and staking')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-500 hover:to-pink-500 transition-all text-left flex items-center gap-3"
                >
                  <Sparkles className="w-5 h-5" />
                  Explain DeFi and staking
                </button>
                <button
                  onClick={() => handleSubmit('How do Solana memecoins work?')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-500 hover:to-pink-500 transition-all text-left flex items-center gap-3"
                >
                  <Sparkles className="w-5 h-5" />
                  How do Solana memecoins work?
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4 mb-24">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[85%] ${message.role === 'user' ? 'order-1' : ''}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                        : 'bg-white/10 text-white backdrop-blur-sm'
                    }`}
                  >
                    <ReactMarkdown className="prose prose-invert prose-sm max-w-none">
                      {message.content}
                    </ReactMarkdown>
                  </div>
                  <div className="text-xs text-purple-300/60 mt-1 px-1">
                    {formatTime(message.timestamp)}
                  </div>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}
            {loading && messages[messages.length - 1]?.content === '' && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white/10 rounded-2xl px-4 py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-purple-300" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-black/60 backdrop-blur-md border-t border-purple-500/20 p-4">
        <div className="max-w-3xl mx-auto">
          {!walletConnected && questionCount > 0 && questionCount < 5 && (
            <div className="mb-2 text-center">
              <span className="inline-block bg-purple-600/30 text-purple-200 text-xs px-3 py-1 rounded-full">
                {5 - questionCount} free questions remaining
              </span>
            </div>
          )}
          {!walletConnected && questionCount >= 5 && (
            <div className="mb-3 text-center">
              <div className="inline-flex flex-col items-center gap-2 bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-500/30 text-purple-100 text-sm px-4 py-3 rounded-xl">
                <span>🎉 You've used your 5 free questions!</span>
                <button
                  onClick={() => setShowWalletPrompt(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-purple-500 hover:to-pink-500 transition-all flex items-center gap-2"
                >
                  <Wallet className="w-4 h-4" />
                  Connect or Create Wallet to Continue
                </button>
                <span className="text-xs text-purple-300">100% free • Unlocks unlimited questions • Earn XP</span>
              </div>
            </div>
          )}
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="flex gap-2">
            {messages.length > 1 && (
              <button
                type="button"
                onClick={resetChat}
                className="bg-purple-600/50 hover:bg-purple-600 text-white p-3 rounded-xl transition-all flex items-center gap-2"
                title="Return to home"
              >
                <Home className="w-5 h-5" />
              </button>
            )}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={!walletConnected && questionCount >= 5 ? "Connect wallet to continue asking questions..." : "Ask anything about Solana..."}
              disabled={loading || (!walletConnected && questionCount >= 5)}
              className="flex-1 bg-white/10 backdrop-blur-md text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-xl"
            />
            <button
              type="submit"
              disabled={loading || !input.trim() || (!walletConnected && questionCount >= 5)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;
