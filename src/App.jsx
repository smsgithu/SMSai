import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Wallet, Sparkles, Send, Home, User, LogOut, Loader2, Twitter, Youtube, Video, Instagram, Linkedin, Calendar, ChevronDown, ExternalLink, MessageSquare, Plus, Trash2, Trophy, Medal, X, ArrowUpRight } from 'lucide-react';
import { getWallets } from '@wallet-standard/app';
import {   
  createDefaultAuthorizationCache,   
  createDefaultChainSelector,   
  createDefaultWalletNotFoundHandler,  
  registerMwa,   
} from '@solana-mobile/wallet-standard-mobile';

/* ───────────────────────────────────────────
   LIQUID GLASS EDITION — smsai.fun
   Frosted glass panels, soft glows, smooth
   motion, refined spacing. Same DNA, new skin.
   ─────────────────────────────────────────── */

function App() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "👋 Welcome to **smsai.fun**\n\nYour AI guide to the Solana ecosystem. We break things down simply—from wallets and seed phrases to staking, DeFi, RWAs, memecoins, and how Solana actually works under the hood.\n\nAsk me anything about Solana.",
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
  const [connectionMessage, setConnectionMessage] = useState('');
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [savedChats, setSavedChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [standardWallets, setStandardWallets] = useState([]);
  const [quickStartQuestions, setQuickStartQuestions] = useState([]);
  const messagesEndRef = useRef(null);
  const hasTrackedSession = useRef(false);
  const walletMenuRef = useRef(null);

  // All possible quick start questions
  const allQuickStartQuestions = [
    { text: 'How do wallets work?', icon: 'wallet' },
    { text: 'What is a seed phrase?', icon: 'sparkle' },
    { text: 'Explain DeFi and staking', icon: 'sparkle' },
    { text: 'How do Solana memecoins work?', icon: 'sparkle' },
    { text: 'What makes Solana fast?', icon: 'sparkle' },
    { text: 'How do NFTs work on Solana?', icon: 'sparkle' },
    { text: 'What is a DEX?', icon: 'sparkle' },
    { text: 'Explain Solana validators', icon: 'sparkle' },
    { text: 'What are SPL tokens?', icon: 'sparkle' },
    { text: 'How do I stay safe in crypto?', icon: 'wallet' },
    { text: 'What is Jupiter Exchange?', icon: 'sparkle' },
    { text: 'How does staking rewards work?', icon: 'sparkle' },
  ];

  useEffect(() => {
    const shuffled = [...allQuickStartQuestions].sort(() => Math.random() - 0.5);
    setQuickStartQuestions(shuffled.slice(0, 4));
  }, []);

  const haptic = (duration = 10) => {
    if (navigator.vibrate) navigator.vibrate(duration);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (walletMenuRef.current && walletMenuRef.current.contains(event.target)) return;
      setShowWalletMenu(false);
    };
    if (showWalletMenu) {
      const timeoutId = setTimeout(() => document.addEventListener('click', handleClickOutside), 0);
      return () => { clearTimeout(timeoutId); document.removeEventListener('click', handleClickOutside); };
    }
  }, [showWalletMenu]);

  useEffect(() => {
    const { get, on } = getWallets();
    setStandardWallets(get());
    const removeListener = on('register', () => setStandardWallets(get()));
    return () => removeListener();
  }, []);

  useEffect(() => {
    registerMwa({  
      appIdentity: { name: 'SMSai', uri: 'https://smsai.fun', icon: '/icon-512.png' },      
      authorizationCache: createDefaultAuthorizationCache(),  
      chains: ['solana:mainnet'],
      chainSelector: createDefaultChainSelector(),  
      onWalletNotFound: createDefaultWalletNotFoundHandler(),  
    });
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const findJupiterWallet = useCallback(() => {
    return standardWallets.find(w => w.name?.toLowerCase().includes('jupiter') || w.name?.toLowerCase() === 'jup');
  }, [standardWallets]);

  const findMwaWallet = useCallback(() => {
    return standardWallets.find(w => 
      w.name?.toLowerCase().includes('mobile wallet adapter') || 
      w.name?.toLowerCase().includes('seed vault') ||
      w.name?.toLowerCase().includes('mwa')
    );
  }, [standardWallets]);

  const walletOptions = useMemo(() => [
    { id: 'seedvault', name: 'Seed Vault', useStandard: true, isMwa: true },
    { id: 'jupiter', name: 'Jupiter', useStandard: true, mobileLink: 'https://jup.ag/onboard', downloadUrl: 'https://chromewebstore.google.com/detail/jupiter-wallet/iledlaeogohbilgbfhmbgkgmpplbfboh' },
    { id: 'phantom', name: 'Phantom', window: 'solana', check: (w) => w?.isPhantom, mobileLink: `https://phantom.app/ul/browse/${encodeURIComponent('https://smsai.fun')}?ref=${encodeURIComponent('https://smsai.fun')}`, downloadUrl: 'https://phantom.app/' },
    { id: 'solflare', name: 'Solflare', window: 'solflare', check: (w) => !!w, mobileLink: `https://solflare.com/ul/v1/browse/${encodeURIComponent('https://smsai.fun')}?ref=${encodeURIComponent('https://smsai.fun')}`, downloadUrl: 'https://solflare.com/' },
    { id: 'backpack', name: 'Backpack', window: 'backpack', check: (w) => w?.isBackpack || (w && typeof w.connect === 'function'), mobileLink: `https://backpack.app/ul/v1/browse/${encodeURIComponent('https://smsai.fun')}?ref=${encodeURIComponent('https://smsai.fun')}`, downloadUrl: 'https://backpack.app/' },
  ], []);

  // ── Data helpers (unchanged logic) ──
  const syncUserData = async (walletAddr, updates = {}) => {
    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: walletAddr, wallet_type: updates.wallet_type || walletType || 'unknown', xp: updates.xp !== undefined ? updates.xp : userXP, questions_asked: updates.questions_asked !== undefined ? updates.questions_asked : questionCount })
      });
      if (!response.ok) throw new Error(`Sync failed: ${response.status}`);
      return (await response.json()).user;
    } catch (error) { console.error('Sync error:', error); throw error; }
  };

  const loadUserData = async (walletAddr) => {
    try {
      const response = await fetch(`/api/user?wallet_address=${walletAddr}`);
      if (!response.ok) { if (response.status === 404) return null; throw new Error(`Load failed: ${response.status}`); }
      return (await response.json()).user;
    } catch (error) { console.error('Load error:', error); return null; }
  };

  const loadLeaderboard = async () => {
    try {
      setLeaderboardLoading(true);
      const response = await fetch('/api/leaderboard');
      if (response.ok) setLeaderboard((await response.json()).leaderboard || []);
    } catch (error) { console.error('Failed to load leaderboard:', error); }
    finally { setLeaderboardLoading(false); }
  };

  const openLeaderboard = () => { setShowLeaderboard(true); loadLeaderboard(); };

  const loadChats = async (walletAddr) => {
    try {
      const response = await fetch(`/api/chats?wallet_address=${walletAddr}`);
      if (response.ok) setSavedChats((await response.json()).chats || []);
    } catch (error) { console.error('Failed to load chats:', error); }
  };

  const saveCurrentChat = async () => {
    if (!walletConnected || messages.length <= 1) return;
    const title = messages.find(m => m.role === 'user')?.content.slice(0, 50) || 'New Chat';
    try {
      const response = await fetch('/api/chats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wallet_address: walletAddress, chat_id: currentChatId, title: title + (title.length >= 50 ? '...' : ''), messages }) });
      if (response.ok) { setCurrentChatId((await response.json()).chat_id); loadChats(walletAddress); }
    } catch (error) { console.error('Failed to save chat:', error); }
  };

  const loadChat = (chat) => { setMessages(chat.messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) }))); setCurrentChatId(chat.id); setShowChatHistory(false); };

  const deleteChat = async (chatId, e) => {
    e.stopPropagation();
    try { await fetch(`/api/chats?chat_id=${chatId}&wallet_address=${walletAddress}`, { method: 'DELETE' }); setSavedChats(savedChats.filter(c => c.id !== chatId)); if (currentChatId === chatId) resetChat(); }
    catch (error) { console.error('Failed to delete chat:', error); }
  };

  const startNewChat = () => { if (walletConnected && messages.length > 1) saveCurrentChat(); setCurrentChatId(null); resetChat(); setShowChatHistory(false); };

  const socialLinks = [
    { name: 'X', url: 'https://x.com/smsonx', Icon: Twitter, label: '@smsonx' },
    { name: 'X', url: 'https://x.com/solmadesimple', Icon: Twitter, label: '@solmadesimple' },
    { name: 'YouTube', url: 'https://www.youtube.com/@SMSONYOUTUBE', Icon: Youtube, label: 'YouTube' },
    { name: 'TikTok', url: 'https://www.tiktok.com/@solanamadesimple', Icon: Video, label: 'TikTok' },
    { name: 'Instagram', url: 'https://www.instagram.com/smscrypto', Icon: Instagram, label: 'Insta' },
    { name: 'LinkedIn', url: 'https://www.linkedin.com/in/sean-suvie-77a35018b/', Icon: Linkedin, label: 'LinkedIn' },
    { name: 'Book Call', url: 'https://calendly.com/seanmsuvie/30min', Icon: Calendar, label: "Let's chat!" }
  ];

  const formatTime = (date) => new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const shortenAddress = (address) => `${address.slice(0, 4)}...${address.slice(-4)}`;
  const isInWalletBrowser = () => !!(window.solana?.isPhantom || window.solflare || window.backpack || findJupiterWallet());

  // ── Init effects ──
  useEffect(() => {
    if (!hasTrackedSession.current) {
      hasTrackedSession.current = true;
      const trackVisit = async () => {
        try {
          const alreadyCounted = sessionStorage.getItem('smsai_visit_counted');
          if (!alreadyCounted) { const response = await fetch('/api/visits', { method: 'POST' }); setSessionCount((await response.json()).count); sessionStorage.setItem('smsai_visit_counted', 'true'); }
          else { setSessionCount((await (await fetch('/api/visits')).json()).count); }
        } catch (error) { console.error('Failed to track visit:', error); setSessionCount(0); }
      };
      trackVisit();
      const savedWallet = localStorage.getItem('smsai_wallet');
      const savedWalletType = localStorage.getItem('smsai_wallet_type');
      if (savedWallet) {
        loadUserData(savedWallet).then(userData => {
          if (userData) { setWalletAddress(savedWallet); setWalletType(savedWalletType || 'unknown'); setWalletConnected(true); setUserXP(userData.xp || 0); setQuestionCount(userData.questions_asked || 0); loadChats(savedWallet); }
          else { localStorage.removeItem('smsai_wallet'); localStorage.removeItem('smsai_wallet_type'); }
        });
      }
    }
  }, []);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const cgData = await (await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana,bitcoin&vs_currencies=usd&include_24hr_change=true')).json();
        setSolPrice({ price: cgData.solana.usd, change: cgData.solana.usd_24h_change });
        setBtcPrice({ price: cgData.bitcoin.usd, change: cgData.bitcoin.usd_24h_change });
      } catch (error) { console.error('Failed to fetch prices:', error); }
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 300000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (walletConnected && messages.length > 1) { const timeout = setTimeout(() => saveCurrentChat(), 3000); return () => clearTimeout(timeout); } }, [messages, walletConnected]);

  // ── Wallet connection (unchanged logic) ──
  const connectWallet = async (walletName) => {
    try {
      const walletConfig = walletOptions.find(w => w.id === walletName);
      if (!walletConfig) { alert('Unknown wallet type.'); return; }
      let publicKey;

      if (walletConfig.isMwa) {
        const mwaWallet = findMwaWallet();
        if (!mwaWallet) { alert('Seed Vault / Mobile Wallet Adapter not available.\n\nThis wallet is only available on Solana Mobile devices with Seed Vault enabled.'); return; }
        const connectFeature = mwaWallet.features['standard:connect'];
        if (!connectFeature) throw new Error('Wallet does not support connect');
        const result = await connectFeature.connect();
        if (result.accounts && result.accounts.length > 0) publicKey = result.accounts[0].address;
        else throw new Error('No accounts returned');
      } else if (walletConfig.useStandard) {
        const jupiterWallet = findJupiterWallet();
        if (!jupiterWallet) {
          if (isMobile && walletConfig.mobileLink) { window.location.href = walletConfig.mobileLink; return; }
          window.open(walletConfig.downloadUrl, '_blank');
          alert(`${walletConfig.name} not detected.\n\n1. Install from the opened page\n2. Refresh this page\n3. Try again`);
          return;
        }
        const connectFeature = jupiterWallet.features['standard:connect'];
        if (!connectFeature) throw new Error('Wallet does not support connect');
        const result = await connectFeature.connect();
        if (result.accounts && result.accounts.length > 0) publicKey = result.accounts[0].address;
        else throw new Error('No accounts returned');
      } else {
        const walletObj = window[walletConfig.window];
        if (!walletObj || !walletConfig.check(walletObj)) {
          if (isMobile && walletConfig.mobileLink) { window.location.href = walletConfig.mobileLink; return; }
          window.open(walletConfig.downloadUrl, '_blank');
          alert(`${walletConfig.name} not detected.\n\n1. Install from the opened page\n2. Refresh this page\n3. Try again`);
          return;
        }
        const response = await walletObj.connect();
        publicKey = walletName === 'solflare' ? (walletObj.publicKey || response?.publicKey) : (response?.publicKey || walletObj.publicKey);
        if (publicKey && typeof publicKey !== 'string') publicKey = publicKey.toString();
      }

      if (!publicKey) throw new Error('Could not find public key');
      const address = typeof publicKey === 'string' ? publicKey : publicKey.toString();
      
      const userData = await loadUserData(address);
      let newXP = 0, newQuestionCount = 0, message = '';
      if (userData) { newXP = userData.xp || 0; newQuestionCount = userData.questions_asked || 0; message = `Welcome back! You have ${newXP} XP`; }
      else { newXP = 20; newQuestionCount = 0; try { await syncUserData(address, { wallet_type: walletName, xp: 20, questions_asked: 0 }); message = 'Wallet connected! +20 XP welcome bonus'; } catch { alert('Connected but failed to save to database. You may need to reconnect.'); return; } }
      
      setWalletAddress(address); setWalletConnected(true); setWalletType(walletName); setUserXP(newXP); setQuestionCount(newQuestionCount);
      setShowWalletPrompt(false); setShowWalletMenu(false);
      localStorage.setItem('smsai_wallet', address); localStorage.setItem('smsai_wallet_type', walletName);
      setConnectionMessage(message); setTimeout(() => setConnectionMessage(''), 5000);
      loadChats(address);
    } catch (error) {
      console.error('Wallet connection error:', error);
      if (error.message?.includes('User rejected') || error.message?.includes('rejected')) alert('Connection cancelled.');
      else if (error.code === 4001) alert('Connection rejected. Please approve in your wallet.');
      else alert(`Connection failed: ${error.message || 'Unknown error'}`);
    }
  };

  const disconnectWallet = () => {
    if (messages.length > 1) saveCurrentChat();
    setWalletConnected(false); setWalletAddress(''); setWalletType(''); setUserXP(0); setQuestionCount(0); setShowWalletMenu(false); setSavedChats([]); setCurrentChatId(null);
    localStorage.removeItem('smsai_wallet'); localStorage.removeItem('smsai_wallet_type');
  };

  const handleSubmit = async (promptText = null) => {
    const userMessage = promptText || input.trim();
    if (!userMessage || loading) return;
    if (!walletConnected && questionCount >= 5) { setShowWalletPrompt(true); return; }
    const newMessages = [...messages, { role: 'user', content: userMessage, timestamp: new Date() }];
    setMessages(newMessages); setInput(''); setLoading(true);
    const newQuestionCount = questionCount + 1;
    setQuestionCount(newQuestionCount);
    if (walletConnected && walletAddress) { const newXP = userXP + 5; setUserXP(newXP); syncUserData(walletAddress, { xp: newXP, questions_asked: newQuestionCount }).catch(() => {}); }
    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: newMessages.slice(-10).map(m => ({ role: m.role, content: m.content })), wallet_address: walletAddress || null }) });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || 'API request failed');
      setMessages([...newMessages, { role: 'assistant', content: data.content || "I received your message but couldn't generate a response. Please try again.", timestamp: new Date() }]);
    } catch (error) { console.error('Chat error:', error); setMessages([...newMessages, { role: 'assistant', content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.", timestamp: new Date() }]); }
    finally { setLoading(false); }
  };

  const resetChat = () => setMessages([{ role: 'assistant', content: "👋 Welcome to **smsai.fun**\n\nYour AI guide to the Solana ecosystem. We break things down simply—from wallets and seed phrases to staking, DeFi, RWAs, memecoins, and how Solana actually works under the hood.\n\nAsk me anything about Solana.", timestamp: new Date() }]);

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy className="w-4 h-4 text-yellow-400" />;
    if (index === 1) return <Medal className="w-4 h-4 text-gray-300" />;
    if (index === 2) return <Medal className="w-4 h-4 text-amber-600" />;
    return <span className="text-xs text-purple-300/80 w-4 text-center font-mono">{index + 1}</span>;
  };

  /* ═══════════════════════════════════════════
     GLASS COMPONENT HELPERS
     Reusable glass panel styles
     ═══════════════════════════════════════════ */
  
  const glass = "backdrop-blur-xl bg-white/[0.04] border border-white/[0.08]";
  const glassHover = "hover:bg-white/[0.08] hover:border-white/[0.12] transition-all duration-300";
  const glassBright = "backdrop-blur-xl bg-white/[0.07] border border-white/[0.12]";
  const glassInput = "backdrop-blur-xl bg-white/[0.06] border border-white/[0.10] focus:border-purple-400/50 focus:bg-white/[0.08]";
  const btnPrimary = "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all duration-300";
  const btnGlass = `${glass} ${glassHover}`;

  return (
    <>
      {/* ── Global Styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');
        
        * { font-family: 'DM Sans', system-ui, sans-serif; }
        
        /* Smooth scrollbar */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(168, 85, 247, 0.2); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(168, 85, 247, 0.4); }
        
        /* Ambient glow behind main content */
        .ambient-glow {
          position: fixed;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.15;
          pointer-events: none;
          z-index: 0;
        }
        
        /* Fade-in animation for messages */
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .msg-enter { animation: fadeSlideUp 0.3s ease-out forwards; }
        
        /* Subtle pulse for loading */
        @keyframes gentlePulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        .loading-dot { animation: gentlePulse 1.4s ease-in-out infinite; }
        .loading-dot:nth-child(2) { animation-delay: 0.2s; }
        .loading-dot:nth-child(3) { animation-delay: 0.4s; }
        
        /* Glass shimmer on modal open */
        @keyframes glassReveal {
          from { opacity: 0; transform: scale(0.96) translateY(8px); backdrop-filter: blur(0px); }
          to { opacity: 1; transform: scale(1) translateY(0); backdrop-filter: blur(20px); }
        }
        .glass-reveal { animation: glassReveal 0.25s ease-out forwards; }

        /* Toast slide in */
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-12px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .toast-enter { animation: toastIn 0.35s ease-out forwards; }
      `}</style>

      <div className="min-h-screen bg-[#0a0a14] flex flex-col relative overflow-hidden">
        {/* ── Ambient background glows ── */}
        <div className="ambient-glow bg-purple-600" style={{ top: '-10%', left: '-5%' }} />
        <div className="ambient-glow bg-pink-600" style={{ bottom: '-10%', right: '-5%' }} />
        <div className="ambient-glow bg-indigo-600" style={{ top: '40%', left: '50%', width: '400px', height: '400px', opacity: 0.08 }} />

        {/* ── Connection Toast ── */}
        {connectionMessage && (
          <div className="fixed top-16 left-1/2 z-50 px-4 w-full max-w-sm toast-enter" style={{ transform: 'translateX(-50%)' }}>
            <div className={`${glassBright} text-white px-4 py-2.5 rounded-2xl shadow-lg shadow-green-500/10 flex items-center gap-2.5 justify-center`}>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="font-medium text-sm">{connectionMessage}</span>
              <button onClick={() => setConnectionMessage('')} className="ml-auto text-white/50 hover:text-white transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════
            LEADERBOARD MODAL
            ═══════════════════════════════════════ */}
        {showLeaderboard && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={() => setShowLeaderboard(false)}>
            <div className={`${glassBright} rounded-3xl p-5 sm:p-6 max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col glass-reveal`} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-white font-semibold text-lg flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                  </div>
                  Leaderboard
                </h2>
                <button onClick={() => setShowLeaderboard(false)} className="text-white/40 hover:text-white transition-colors p-1"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1.5">
                {leaderboardLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-purple-400 loading-dot" />
                      <div className="w-2 h-2 rounded-full bg-purple-400 loading-dot" />
                      <div className="w-2 h-2 rounded-full bg-purple-400 loading-dot" />
                    </div>
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-white/40 text-sm mb-4">No users yet. Be the first to earn XP!</p>
                    {!walletConnected && <button onClick={() => { setShowLeaderboard(false); setShowWalletPrompt(true); }} className={`${btnPrimary} text-white rounded-xl px-5 py-2.5 font-medium text-sm`}>Connect Wallet</button>}
                  </div>
                ) : leaderboard.map((user, index) => (
                  <div key={user.wallet_address} className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${walletAddress === user.wallet_address ? 'bg-purple-500/15 border border-purple-500/20' : `bg-white/[0.02] ${glassHover}`}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-6 flex justify-center">{getRankIcon(index)}</div>
                      <div>
                        <span className="text-white/90 text-sm font-mono tracking-tight">{shortenAddress(user.wallet_address)}</span>
                        {walletAddress === user.wallet_address && <span className="ml-2 text-[10px] text-purple-400 font-medium">you</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-white/30 text-xs tabular-nums">{user.questions_asked || 0} Q's</span>
                      <span className="text-yellow-400/90 font-semibold text-sm tabular-nums">{user.xp || 0} XP</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-white/[0.06]">
                <button onClick={loadLeaderboard} disabled={leaderboardLoading} className={`w-full ${btnGlass} text-white/60 rounded-xl px-4 py-2.5 font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-40`}>
                  {leaderboardLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '↻'} Refresh
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════
            CHAT HISTORY DRAWER
            ═══════════════════════════════════════ */}
        {showChatHistory && walletConnected && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex" onClick={() => setShowChatHistory(false)}>
            <div className={`backdrop-blur-2xl bg-[#0d0d1a]/95 border-r border-white/[0.06] w-72 max-w-[80vw] h-full p-5 overflow-y-auto glass-reveal`} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-white font-semibold text-base">History</h3>
                <button onClick={() => setShowChatHistory(false)} className="text-white/40 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <button onClick={startNewChat} className={`w-full ${btnPrimary} text-white rounded-xl px-3 py-2.5 font-medium text-sm flex items-center justify-center gap-2 mb-5`}>
                <Plus className="w-4 h-4" /> New Chat
              </button>
              {savedChats.length === 0 ? <p className="text-white/30 text-sm text-center mt-8">No saved chats yet</p> : (
                <div className="space-y-1.5">
                  {savedChats.map((chat) => (
                    <div key={chat.id} onClick={() => loadChat(chat)} className={`p-3 rounded-xl cursor-pointer group transition-all duration-200 ${currentChatId === chat.id ? 'bg-purple-500/15 border border-purple-500/20' : 'hover:bg-white/[0.04]'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-white/80 text-sm truncate">{chat.title}</p>
                          <p className="text-white/25 text-xs mt-0.5">{new Date(chat.updated_at).toLocaleDateString()}</p>
                        </div>
                        <button onClick={(e) => deleteChat(chat.id, e)} className="text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════
            WALLET PROMPT MODAL
            ═══════════════════════════════════════ */}
        {showWalletPrompt && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4 py-4" onClick={() => setShowWalletPrompt(false)}>
            <div className={`${glassBright} rounded-3xl p-6 max-w-sm w-full max-h-[85vh] overflow-y-auto relative glass-reveal`} onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowWalletPrompt(false)} className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4 border border-white/[0.08]">
                  <Wallet className="w-6 h-6 text-purple-300" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Connect Wallet</h2>
                <p className="text-white/50 text-sm mb-1">You've explored 5 questions! 🎉</p>
                <p className="text-white/30 text-xs mb-5">Free forever. Connect to unlock unlimited questions + XP.</p>
                
                {isMobile && !isInWalletBrowser() && (
                  <div className={`${glass} rounded-xl p-3 mb-4`}>
                    <p className="text-xs text-blue-300/80">📱 Tap a wallet to open this site in that wallet's browser</p>
                  </div>
                )}
                
                {findMwaWallet() && (
                  <div className={`${glass} rounded-2xl p-4 mb-4 border-green-500/20`}>
                    <p className="text-xs text-green-300/80 font-medium mb-3">📱 Solana Mobile Detected</p>
                    <button onClick={() => { haptic(); connectWallet('seedvault'); }} className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white rounded-xl px-4 py-3 font-medium shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 text-sm transition-all duration-300">
                      <Wallet className="w-4 h-4" />Seed Vault
                    </button>
                  </div>
                )}
                
                <div className="space-y-2 mb-5">
                  <p className="text-xs text-white/30 font-medium mb-2">{findMwaWallet() ? 'Or select a wallet:' : 'Select a wallet:'}</p>
                  {walletOptions.filter(w => !w.isMwa).map((wallet) => (
                    <button key={wallet.id} onClick={() => { haptic(); connectWallet(wallet.id); }} className={`w-full ${btnGlass} text-white/80 hover:text-white rounded-xl px-4 py-3 font-medium flex items-center justify-center gap-2.5 text-sm`}>
                      <Wallet className="w-4 h-4 text-purple-400" />
                      {wallet.name}
                      {isMobile && !isInWalletBrowser() && !wallet.isMwa && <ExternalLink className="w-3 h-3 text-white/20" />}
                    </button>
                  ))}
                </div>
                
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.06]" /></div>
                  <div className="relative flex justify-center text-xs"><span className="bg-[#0d0d1a] px-3 text-white/25">New to crypto?</span></div>
                </div>
                
                <div className={`${glass} rounded-2xl p-4 mb-4 text-left`}>
                  <h3 className="text-white/80 font-medium text-sm mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-purple-400" />Create a wallet in 2 min</h3>
                  <ol className="text-xs text-white/40 space-y-2">
                    <li className="flex gap-2.5"><span className="text-purple-400 font-semibold">1.</span>Tap any wallet above to visit their site</li>
                    <li className="flex gap-2.5"><span className="text-purple-400 font-semibold">2.</span>Install the extension or mobile app</li>
                    <li className="flex gap-2.5"><span className="text-purple-400 font-semibold">3.</span>Create a new wallet (30 seconds)</li>
                    <li className="flex gap-2.5"><span className="text-purple-400 font-semibold">4.</span>Save your seed phrase securely</li>
                    <li className="flex gap-2.5"><span className="text-purple-400 font-semibold">5.</span>Return here and connect</li>
                  </ol>
                  <p className="text-[10px] text-white/20 mt-3">💡 Free, no personal info, no crypto needed.</p>
                </div>
                
                <button onClick={() => setShowWalletPrompt(false)} className={`w-full ${btnGlass} text-white/40 rounded-xl px-4 py-2.5 font-medium text-sm`}>Maybe Later</button>
                <p className="text-[10px] text-white/15 mt-3">No transactions • Just sign-in</p>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════
            PRICE TICKER BAR
            ═══════════════════════════════════════ */}
        <div className="relative z-10 border-b border-white/[0.04] px-3 py-2">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-center items-center gap-4 sm:gap-8 mb-1.5">
              {solPrice && (
                <div className="flex items-center gap-1.5">
                  <span className="text-purple-300/60 font-medium text-[10px] sm:text-xs tracking-wide">SOL</span>
                  <span className="text-white/80 font-semibold text-[10px] sm:text-xs tabular-nums">${solPrice.price.toFixed(2)}</span>
                  <span className={`text-[9px] sm:text-[10px] font-medium tabular-nums ${solPrice.change >= 0 ? 'text-green-400/80' : 'text-red-400/80'}`}>
                    {solPrice.change >= 0 ? '+' : ''}{solPrice.change.toFixed(1)}%
                  </span>
                </div>
              )}
              {btcPrice && (
                <div className="flex items-center gap-1.5">
                  <span className="text-orange-300/60 font-medium text-[10px] sm:text-xs tracking-wide">BTC</span>
                  <span className="text-white/80 font-semibold text-[10px] sm:text-xs tabular-nums">${(btcPrice.price / 1000).toFixed(1)}k</span>
                  <span className={`text-[9px] sm:text-[10px] font-medium tabular-nums ${btcPrice.change >= 0 ? 'text-green-400/80' : 'text-red-400/80'}`}>
                    {btcPrice.change >= 0 ? '+' : ''}{btcPrice.change.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
            <div className="flex justify-center">
              <div className={`${glass} rounded-full px-3 py-1`}>
                <p className="text-[9px] sm:text-xs text-white/40 text-center">
                  <span className="text-green-400/60 font-medium">Free</span> · 5 questions · Connect wallet for unlimited
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════
            MAIN CONTENT AREA
            ═══════════════════════════════════════ */}
        <div className="flex-1 flex flex-col items-center px-3 sm:px-4 pt-3 sm:pt-6 pb-4 overflow-y-auto relative z-10">
          <div className="w-full max-w-4xl">

            {/* ── Mobile Header ── */}
            <div className="block sm:hidden mb-3">
              <div className="flex items-center gap-2 mb-2">
                {walletConnected && (
                  <button onClick={() => { haptic(); setShowChatHistory(true); }} className={`${btnGlass} p-1.5 rounded-xl`}>
                    <MessageSquare className="w-4 h-4 text-purple-300/60" />
                  </button>
                )}
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0 border border-white/[0.08]">
                  <Sparkles className="w-4 h-4 text-purple-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-base font-semibold text-white/90 leading-tight tracking-tight">smsai.fun</h1>
                  <p className="text-[10px] text-white/30">AI Guide to Solana</p>
                </div>
                <button onClick={() => { haptic(); openLeaderboard(); }} className={`${btnGlass} p-1.5 rounded-xl`}>
                  <Trophy className="w-4 h-4 text-yellow-400/60" />
                </button>
                {walletConnected ? (
                  <div ref={walletMenuRef} className="relative">
                    <button onClick={() => setShowWalletMenu(!showWalletMenu)} className={`${btnGlass} flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl`}>
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      <span className="text-[10px] text-white/70 font-mono">{shortenAddress(walletAddress)}</span>
                      <ChevronDown className="w-3 h-3 text-white/30" />
                    </button>
                    {showWalletMenu && (
                      <div className={`absolute right-0 top-full mt-1.5 ${glassBright} rounded-xl shadow-2xl shadow-black/40 z-50 min-w-[140px] glass-reveal`}>
                        <div className="px-3 py-2 border-b border-white/[0.06] text-[10px] text-white/40">{userXP} XP · {questionCount} questions</div>
                        <button onClick={(e) => { e.stopPropagation(); disconnectWallet(); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-red-400/80 hover:text-red-400 hover:bg-red-500/5 transition-colors rounded-b-xl"><LogOut className="w-3 h-3" />Disconnect</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button onClick={() => { haptic(); setShowWalletPrompt(true); }} className={`${btnPrimary} text-white px-3 py-1.5 rounded-xl text-[10px] font-medium flex items-center gap-1.5`}>
                    <Wallet className="w-3 h-3" />Connect
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] text-white/20 tabular-nums">{sessionCount} visits</span>
                <div className="flex items-center gap-2.5">
                  {socialLinks.map((link) => (
                    <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="text-white/20 hover:text-white/60 transition-colors">
                      <link.Icon className="w-3.5 h-3.5" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Desktop Header ── */}
            <div className="hidden sm:block">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {walletConnected && (
                    <button onClick={() => { haptic(); setShowChatHistory(true); }} className={`${btnGlass} flex items-center gap-2 p-2.5 rounded-xl`} title="Chat History">
                      <MessageSquare className="w-4 h-4 text-purple-300/60" />
                      <span className="text-xs text-white/40">History</span>
                    </button>
                  )}
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/15 to-pink-500/15 flex items-center justify-center border border-white/[0.08]">
                    <Sparkles className="w-5 h-5 text-purple-300" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold text-white/90 tracking-tight">smsai.fun</h1>
                    <p className="text-sm text-white/30">Your AI Guide to Solana</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {socialLinks.map((link) => (
                    <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-0.5 text-white/25 hover:text-white/60 transition-colors group">
                      <link.Icon className="w-4 h-4" />
                      <span className="text-[9px]">{link.label}</span>
                    </a>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs text-white/20 tabular-nums">{sessionCount} visits</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => { haptic(); openLeaderboard(); }} className={`${btnGlass} flex items-center gap-2 px-3 py-2 rounded-xl`}>
                    <Trophy className="w-4 h-4 text-yellow-400/60" />
                    <span className="text-sm text-white/50">Leaderboard</span>
                  </button>
                  <div ref={walletMenuRef} className="relative">
                    {walletConnected ? (
                      <>
                        <button onClick={() => setShowWalletMenu(!showWalletMenu)} className={`${btnGlass} flex items-center gap-2.5 px-3 py-2 rounded-xl`}>
                          <div className="w-2 h-2 rounded-full bg-green-400" />
                          <div className="text-left">
                            <div className="text-xs text-white/70 font-mono">{shortenAddress(walletAddress)}</div>
                            <div className="text-[10px] text-white/30">{userXP} XP · {questionCount} questions</div>
                          </div>
                          <ChevronDown className="w-4 h-4 text-white/20" />
                        </button>
                        {showWalletMenu && (
                          <div className={`absolute right-0 top-full mt-2 ${glassBright} rounded-xl shadow-2xl shadow-black/40 z-50 min-w-[160px] glass-reveal`}>
                            <button onClick={(e) => { e.stopPropagation(); disconnectWallet(); }} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400/80 hover:text-red-400 hover:bg-red-500/5 transition-colors rounded-xl">
                              <LogOut className="w-4 h-4" />Disconnect
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <button onClick={() => { haptic(); setShowWalletPrompt(true); }} className={`${btnPrimary} text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2`}>
                        <Wallet className="w-4 h-4" />Connect Wallet
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Quick Start Questions ── */}
            {messages.length === 1 && (
              <div className="mb-4 sm:mb-6">
                <p className="text-[10px] sm:text-xs text-white/25 mb-2.5 text-center tracking-wide uppercase">Quick Start</p>
                <div className="grid grid-cols-2 gap-2 sm:gap-3 max-w-2xl mx-auto">
                  {quickStartQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => { haptic(); handleSubmit(q.text); }}
                      className={`${btnGlass} group text-white/70 hover:text-white px-3 sm:px-5 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl text-left flex items-center gap-2 sm:gap-3`}
                    >
                      {q.icon === 'wallet' 
                        ? <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 text-purple-400/60 group-hover:text-purple-300 transition-colors" /> 
                        : <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 text-purple-400/60 group-hover:text-purple-300 transition-colors" />
                      }
                      <span className="text-[11px] sm:text-sm font-medium">{q.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════
                MESSAGES
                ═══════════════════════════════════════ */}
            <div className="space-y-3 sm:space-y-4 mb-20 sm:mb-24 max-w-2xl mx-auto">
              {messages.map((message, index) => (
                <div key={index} className={`flex gap-2.5 msg-enter ${message.role === 'user' ? 'justify-end' : 'justify-start'}`} style={{ animationDelay: `${index * 0.05}s` }}>
                  {message.role === 'assistant' && (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-purple-500/15 to-pink-500/15 flex items-center justify-center flex-shrink-0 border border-white/[0.06] mt-0.5">
                      <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-300/80" />
                    </div>
                  )}
                  <div className={`max-w-[85%] ${message.role === 'user' ? 'order-1' : ''}`}>
                    <div className={`rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 ${
                      message.role === 'user' 
                        ? `${btnPrimary} text-white` 
                        : `${glass} text-white/85`
                    }`}>
                      <ReactMarkdown className="prose prose-invert prose-sm max-w-none text-xs sm:text-[15px] leading-relaxed [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:mb-2 [&>ol]:mb-2 [&_strong]:text-white [&_a]:text-purple-300 [&_a]:underline [&_a]:underline-offset-2 [&_code]:text-pink-300/80 [&_code]:bg-white/[0.06] [&_code]:px-1 [&_code]:rounded">
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-white/20 mt-1 px-1 font-mono">{formatTime(message.timestamp)}</div>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-blue-500/15 to-cyan-500/15 flex items-center justify-center flex-shrink-0 border border-white/[0.06] mt-0.5">
                      <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-300/80" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-2.5 msg-enter">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-purple-500/15 to-pink-500/15 flex items-center justify-center border border-white/[0.06]">
                    <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-300/80" />
                  </div>
                  <div className={`${glass} rounded-2xl px-4 py-3 flex gap-1.5`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400/60 loading-dot" />
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400/60 loading-dot" />
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400/60 loading-dot" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════
            INPUT BAR
            ═══════════════════════════════════════ */}
        <div className="fixed bottom-0 left-0 right-0 backdrop-blur-2xl bg-[#0a0a14]/80 border-t border-white/[0.04] p-2.5 sm:p-4 z-20">
          <div className="max-w-2xl mx-auto">
            {!walletConnected && questionCount > 0 && questionCount < 5 && (
              <div className="mb-2 text-center">
                <span className={`inline-block ${glass} text-white/40 text-[9px] sm:text-xs px-3 py-1 rounded-full font-medium`}>
                  {5 - questionCount} free question{5 - questionCount !== 1 ? 's' : ''} left
                </span>
              </div>
            )}
            {!walletConnected && questionCount >= 5 && (
              <div className="mb-2.5 text-center">
                <div className={`inline-flex flex-col items-center gap-1.5 ${glass} text-white/60 text-[10px] sm:text-sm px-4 py-2.5 rounded-xl`}>
                  <span>5 free questions used</span>
                  <button onClick={() => setShowWalletPrompt(true)} className={`${btnPrimary} text-white px-4 py-1.5 rounded-lg font-medium flex items-center gap-1.5 text-[10px] sm:text-sm`}>
                    <Wallet className="w-3 h-3" />Connect to Continue
                  </button>
                </div>
              </div>
            )}
            <div className="flex gap-2 sm:gap-2.5">
              {messages.length > 1 && (
                <button type="button" onClick={() => { haptic(); startNewChat(); }} className={`${btnGlass} text-white/50 p-2.5 sm:p-3 rounded-xl`} title="New Chat">
                  <Home className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
              <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="flex-1 flex gap-2 sm:gap-2.5">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={!walletConnected && questionCount >= 5 ? "Connect wallet to continue..." : "Ask about Solana..."}
                  disabled={loading || (!walletConnected && questionCount >= 5)}
                  className={`flex-1 ${glassInput} text-white/90 placeholder-white/25 focus:outline-none disabled:opacity-40 px-4 py-2.5 sm:py-3 rounded-xl text-sm transition-all duration-300`}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim() || (!walletConnected && questionCount >= 5)}
                  onClick={() => haptic()}
                  className={`${btnPrimary} text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium disabled:opacity-30 disabled:shadow-none`}
                >
                  {loading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Send className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </form>
            </div>
            <div className="flex justify-center items-center gap-3 sm:gap-4 mt-2.5 text-[9px] sm:text-[11px] text-white/15">
              <a href="/privacy.html" className="hover:text-white/40 transition-colors">Privacy</a>
              <span>·</span>
              <a href="/terms.html" className="hover:text-white/40 transition-colors">Terms</a>
              <span>·</span>
              <a href="/copyright.html" className="hover:text-white/40 transition-colors">Copyright</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
