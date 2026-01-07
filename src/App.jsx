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
  const [smsPrice, setSmsPrice] = useState(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletType, setWalletType] = useState('');
  const [userXP, setUserXP] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [showWalletPrompt, setShowWalletPrompt] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState('');
  const [detectedWallets, setDetectedWallets] = useState([]);
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

  // Sync user data with backend
  const syncUserData = async (walletAddress, updates = {}) => {
    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: walletAddress,
          ...updates
        })
      });

      if (!response.ok) {
        throw new Error('Failed to sync user data');
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Failed to sync user data:', error);
      return null;
    }
  };

  // Load user data from backend
  const loadUserData = async (walletAddress) => {
    try {
      const response = await fetch(`/api/user?wallet_address=${walletAddress}`);
      
      if (!response.ok) {
        throw new Error('Failed to load user data');
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Failed to load user data:', error);
      return null;
    }
  };

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

      // Detect installed wallets
      const detected = walletOptions.filter(wallet => {
        const w = window[wallet.window];
        return wallet.check(w);
      });
      setDetectedWallets(detected.map(w => w.id));
      console.log('Detected wallets:', detected.map(w => w.name));
    }
  }, []);

  // Fetch crypto prices - 5 minutes
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        // Fetch SOL and BTC from CoinGecko (has 24h change)
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

        // Fetch SMS from Jupiter API
        const smsContract = 'A9FmiDpt5UMwuvJgR759RJMEHdXzwwymyisMNfxvBAGS';
        const jupResponse = await fetch(`https://price.jup.ag/v4/price?ids=${smsContract}`);
        const jupData = await jupResponse.json();
        
        if (jupData.data && jupData.data[smsContract]) {
          setSmsPrice({
            price: jupData.data[smsContract].price,
            change: 0 // Jupiter doesn't provide 24h change easily
          });
        }
      } catch (error) {
        console.error('Failed to fetch prices:', error);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const connectWallet = async (walletName) => {
    try {
      const walletConfig = walletOptions.find(w => w.id === walletName);
      
      if (!walletConfig) {
        alert('Unknown wallet type. Please select a valid wallet.');
        return;
      }

      const walletObj = window[walletConfig.window];
      
      console.log('Attempting to connect:', walletName);
      console.log('Wallet object exists:', !!walletObj);

      // Check if wallet is installed
      if (!walletObj || !walletConfig.check(walletObj)) {
        console.log(walletConfig.name, 'not found');
        
        // Provide download links based on wallet type
        const downloadUrls = {
          phantom: 'https://phantom.app/',
          solflare: 'https://solflare.com/',
          backpack: 'https://backpack.app/',
          jupiter: 'https://jup.ag/mobile',
          glow: 'https://glow.app/',
          coinbase: 'https://www.coinbase.com/wallet'
        };
        
        const url = downloadUrls[walletName] || 'https://solana.com/ecosystem/explore?categories=wallet';
        window.open(url, '_blank');
        
        alert(`${walletConfig.name} wallet not detected.\n\n1. Install ${walletConfig.name} from the opened page\n2. Refresh this page\n3. Try connecting again\n\nMake sure the extension is enabled in your browser.`);
        return;
      }

      console.log('Connecting to', walletConfig.name, '...');
      
      // Connect to wallet
      const response = await walletObj.connect();
      console.log('Wallet response:', response);
      console.log('Wallet object after connect:', walletObj);
      
      // Different wallets return public keys in different formats
      let publicKey;
      
      // Special handling for Solflare
      if (walletName === 'solflare') {
        if (walletObj.publicKey) {
          console.log('Found publicKey in walletObj.publicKey (Solflare)');
          publicKey = walletObj.publicKey;
        } else if (response?.publicKey) {
          console.log('Found publicKey in response.publicKey (Solflare)');
          publicKey = response.publicKey;
        }
      } 
      // Standard checks for other wallets
      else if (response?.publicKey) {
        console.log('Found publicKey in response.publicKey');
        publicKey = response.publicKey;
      } else if (response?.solana?.publicKey) {
        console.log('Found publicKey in response.solana.publicKey');
        publicKey = response.solana.publicKey;
      } else if (walletObj.publicKey) {
        console.log('Found publicKey in walletObj.publicKey');
        publicKey = walletObj.publicKey;
      }
      
      if (!publicKey) {
        console.error('Could not find publicKey. Response:', response);
        console.error('Wallet object:', walletObj);
        throw new Error('Could not find public key in wallet response');
      }
      
      // Convert to string - handle both string and object formats
      const address = typeof publicKey === 'string' 
        ? publicKey 
        : publicKey.toString();
      
      console.log('Connected successfully:', address);
      
      // Load user data from backend
      const userData = await loadUserData(address);
      
      let newXP = userXP;
      let newQuestionCount = questionCount;
      let message = '';
      
      if (userData) {
        // User exists in database - load their data
        newXP = userData.xp || 0;
        newQuestionCount = userData.questions_asked || 0;
        message = `Welcome back! You have ${newXP} XP`;
        console.log('Loaded user data from backend:', userData);
      } else {
        // New user - award welcome bonus and create account
        newXP = 20;
        await syncUserData(address, {
          wallet_type: walletName,
          xp: 20,
          questions_asked: 0
        });
        message = 'Wallet connected! +20 XP welcome bonus';
        console.log('New user created with welcome bonus');
      }
      
      setWalletAddress(address);
      setWalletConnected(true);
      setWalletType(walletName);
      setUserXP(newXP);
      setQuestionCount(newQuestionCount);
      setShowWalletPrompt(false);
      
      setConnectionMessage(message);
      setTimeout(() => setConnectionMessage(''), 5000);
      
      // Save to localStorage as backup
      localStorage.setItem('smsai_wallet', address);
      localStorage.setItem('smsai_wallet_type', walletName);
      localStorage.setItem('smsai_xp', newXP.toString());
      localStorage.setItem('smsai_questions', newQuestionCount.toString());
      
    } catch (error) {
      console.error('Wallet connection error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        wallet: walletName
      });
      
      // Better error messages based on error type
      if (error.message && error.message.includes('User rejected')) {
        alert('Connection cancelled. Click the wallet button when ready to connect.');
      } else if (error.code === 4001) {
        alert('Connection request was rejected. Please approve the connection in your wallet.');
      } else if (error.message && error.message.includes('Already processing')) {
        alert('Please check your wallet - there may be a pending connection request.');
      } else if (error.message && error.message.includes('Could not find public key')) {
        alert('Wallet connected but returned unexpected data format.\n\nPlease try:\n1. Refreshing the page\n2. Disconnecting and reconnecting the wallet\n3. Using a different wallet');
      } else {
        alert('Wallet connection failed.\n\nPlease try:\n1. Refreshing the page\n2. Unlocking your wallet\n3. Making sure your wallet extension is enabled\n4. Trying a different wallet\n\nError: ' + (error.message || 'Unknown error'));
      }
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
      
      // Sync XP with backend
      syncUserData(walletAddress, {
        xp: newXP,
        questions_asked: newQuestionCount
      }).catch(err => console.error('Failed to sync XP:', err));
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
      {/* Connection Success Message */}
      {connectionMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-green-600/30 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-lg border border-green-400/50 flex items-center gap-3 relative">
            <span className="text-2xl">🎉</span>
            <span className="font-semibold">{connectionMessage}</span>
            <button
              onClick={() => setConnectionMessage('')}
              className="ml-2 text-white/80 hover:text-white transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Wallet Connect Prompt Modal */}
      {showWalletPrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4 py-8">
          <div className="bg-gradient-to-br from-slate-900 to-purple-900 border border-purple-500/30 rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto relative">
            {/* Close button */}
            <button
              onClick={() => setShowWalletPrompt(false)}
              className="absolute top-4 right-4 text-purple-300 hover:text-white transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Connect Your Wallet</h2>
              <p className="text-purple-200 mb-6">
                You've asked 5 questions! Connect your Solana wallet to continue learning for free, track your progress, and earn XP.
              </p>
              <p className="text-sm text-purple-300 mb-3">Select your wallet:</p>
              
              <div className="space-y-3 mb-4">
                {/* Show all wallets - no detection */}
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
              
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-purple-500/30"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-gradient-to-br from-slate-900 to-purple-900 px-3 text-purple-300">
                      Don't have a wallet?
                    </span>
                  </div>
                </div>
                
                <div className="bg-purple-900/30 border border-purple-500/30 rounded-xl p-4">
                  <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Create Your First Wallet
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
                <span className="text-pink-400 font-semibold text-xs sm:text-sm">SMS</span>
                <span className="text-white font-bold text-xs sm:text-sm">
                  ${smsPrice.price < 0.01 ? smsPrice.price.toFixed(6) : smsPrice.price.toFixed(4)}
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
          <div className="hidden sm:flex items-center gap-4">
            <div className="text-sm text-purple-300/80">
              <Eye className="w-4 h-4 inline mr-1" />
              {sessionCount.toLocaleString()} visits
            </div>
          </div>
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
          {!walletConnected && questionCount > 0 && questionCount < 5 && (
            <div className="text-center mb-3">
              <span className="text-sm text-purple-300 bg-purple-900/30 px-4 py-2 rounded-full border border-purple-500/30">
                {5 - questionCount} free {5 - questionCount === 1 ? 'question' : 'questions'} remaining
              </span>
            </div>
          )}
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
