import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Calendar, ChevronDown, Home, Instagram, Linkedin, Loader2, LogOut,
  MessageSquare, Plus, Send, Sparkles, Trash2, Trophy, User, Wallet, X, Youtube,
} from 'lucide-react';
import { getWallets } from '@wallet-standard/app';
import {
  createDefaultAuthorizationCache,
  createDefaultChainSelector,
  createDefaultWalletNotFoundHandler,
  registerMwa,
} from '@solana-mobile/wallet-standard-mobile';
import { FREE_QUESTION_LIMIT, WELCOME_MESSAGE, shortenAddress } from '../shared/product.js';
import { authHeaders, clearSession, rememberSession } from './lib/api.js';
import { signWalletMessage } from './lib/sign.js';
import ChatUserIdentity from './components/ChatUserIdentity.jsx';
import HelpModal from './components/HelpModal.jsx';
import InfoModal from './components/InfoModal.jsx';
import LeaderboardModal from './components/LeaderboardModal.jsx';
import ProfileModal from './components/ProfileModal.jsx';
import WalletModal from './components/WalletModal.jsx';

const XIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const TikTokIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
  </svg>
);

const QUICK_START = [
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
  { text: 'How do staking rewards work?', icon: 'sparkle' },
];

const SOCIAL_LINKS = [
  { name: 'X', url: 'https://x.com/smsonx', Icon: XIcon, label: '@smsonx' },
  { name: 'X brand', url: 'https://x.com/solmadesimple', Icon: XIcon, label: '@solmadesimple' },
  { name: 'YouTube', url: 'https://www.youtube.com/@SMSONYOUTUBE', Icon: Youtube, label: 'YouTube' },
  { name: 'TikTok', url: 'https://www.tiktok.com/@smsontiktokk', Icon: TikTokIcon, label: 'TikTok' },
  { name: 'Instagram', url: 'https://www.instagram.com/smsoninstaa', Icon: Instagram, label: 'Insta' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/in/sean-suvie-77a35018b/', Icon: Linkedin, label: 'LinkedIn' },
  { name: 'Book Call', url: 'https://calendly.com/seanmsuvie/30min', Icon: Calendar, label: "Let's chat" },
];

const welcomeMessage = () => ({ role: 'assistant', content: WELCOME_MESSAGE, timestamp: new Date() });
const formatTime = (date) => new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
const haptic = (duration = 10) => { if (navigator.vibrate) navigator.vibrate(duration); };

function App() {
  const [messages, setMessages] = useState([welcomeMessage()]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [solPrice, setSolPrice] = useState(null);
  const [btcPrice, setBtcPrice] = useState(null);
  const [orePrice, setOrePrice] = useState(null);
  const [sessionCount, setSessionCount] = useState(null);
  const [visitsUnavailable, setVisitsUnavailable] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [userXP, setUserXP] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [avatarId, setAvatarId] = useState(null);
  const [showWalletPrompt, setShowWalletPrompt] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState('');
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [savedChats, setSavedChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState('');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileMode, setProfileMode] = useState('setup');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [standardWallets, setStandardWallets] = useState([]);
  const [quickStartQuestions, setQuickStartQuestions] = useState([]);
  const messagesEndRef = useRef(null);
  const hasTrackedSession = useRef(false);
  const walletMenuRef = useRef(null);
  const chatState = useRef({});

  chatState.current = { walletConnected, walletAddress, messages, currentChatId };

  useEffect(() => {
    const shuffled = [...QUICK_START].sort(() => Math.random() - 0.5);
    setQuickStartQuestions(shuffled.slice(0, 4));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (walletMenuRef.current && walletMenuRef.current.contains(event.target)) return;
      setShowWalletMenu(false);
    };
    if (!showWalletMenu) return undefined;
    const timeoutId = setTimeout(() => document.addEventListener('click', handleClickOutside), 0);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
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

  const findJupiterWallet = useCallback(() => (
    standardWallets.find((wallet) => wallet.name?.toLowerCase().includes('jupiter') || wallet.name?.toLowerCase() === 'jup')
  ), [standardWallets]);

  const findMwaWallet = useCallback(() => (
    standardWallets.find((wallet) => {
      const name = wallet.name?.toLowerCase() || '';
      return name.includes('mobile wallet adapter') || name.includes('seed vault') || name.includes('mwa');
    })
  ), [standardWallets]);

  const walletOptions = useMemo(() => [
    { id: 'seedvault', name: 'Seed Vault', isMwa: true },
    { id: 'jupiter', name: 'Jupiter', mobileLink: 'https://jup.ag/onboard', downloadUrl: 'https://chromewebstore.google.com/detail/jupiter-wallet/iledlaeogohbilgbfhmbgkgmpplbfboh' },
    { id: 'phantom', name: 'Phantom', window: 'solana', check: (wallet) => wallet?.isPhantom, mobileLink: `https://phantom.app/ul/browse/${encodeURIComponent('https://smsai.fun')}?ref=${encodeURIComponent('https://smsai.fun')}`, downloadUrl: 'https://phantom.app/' },
    { id: 'solflare', name: 'Solflare', window: 'solflare', check: (wallet) => !!wallet, mobileLink: `https://solflare.com/ul/v1/browse/${encodeURIComponent('https://smsai.fun')}?ref=${encodeURIComponent('https://smsai.fun')}`, downloadUrl: 'https://solflare.com/' },
    { id: 'backpack', name: 'Backpack', window: 'backpack', check: (wallet) => wallet?.isBackpack || (wallet && typeof wallet.connect === 'function'), mobileLink: `https://backpack.app/ul/v1/browse/${encodeURIComponent('https://smsai.fun')}?ref=${encodeURIComponent('https://smsai.fun')}`, downloadUrl: 'https://backpack.app/' },
  ], []);

  const applyUser = useCallback((user, token) => {
    setWalletAddress(user.wallet_address);
    setWalletConnected(true);
    setUserXP(user.xp || 0);
    setQuestionCount(user.questions_asked || 0);
    setDisplayName(user.display_name || '');
    setAvatarId(user.avatar_id || null);
    if (token) {
      rememberSession(token);
    }
    localStorage.setItem('smsai_wallet', user.wallet_address);
    if (user.wallet_type) localStorage.setItem('smsai_wallet_type', user.wallet_type);
    if (user.needs_profile) {
      setProfileMode('setup');
      setProfileOpen(true);
    }
  }, []);

  const loadChats = useCallback(async (walletAddr) => {
    try {
      const response = await fetch(`/api/chats?wallet_address=${walletAddr}`, { headers: authHeaders() });
      if (response.ok) setSavedChats((await response.json()).chats || []);
    } catch (error) {
      console.error('Failed to load chats:', error);
    }
  }, []);

  const saveCurrentChat = useCallback(async () => {
    const state = chatState.current;
    if (!state.walletConnected || state.messages.length <= 1) return;
    const title = state.messages.find((message) => message.role === 'user')?.content.slice(0, 50) || 'New Chat';
    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          wallet_address: state.walletAddress,
          chat_id: state.currentChatId,
          title: title + (title.length >= 50 ? '...' : ''),
          messages: state.messages,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentChatId(data.chat_id);
        loadChats(state.walletAddress);
      }
    } catch (error) {
      console.error('Failed to save chat:', error);
    }
  }, [loadChats]);

  const resetChat = useCallback(() => setMessages([welcomeMessage()]), []);

  const disconnectWallet = useCallback(() => {
    if (chatState.current.messages.length > 1) saveCurrentChat();
    setWalletConnected(false);
    setWalletAddress('');
    setUserXP(0);
    setQuestionCount(0);
    setDisplayName('');
    setAvatarId(null);
    setShowWalletMenu(false);
    setSavedChats([]);
    setCurrentChatId(null);
    setProfileOpen(false);
    clearSession();
  }, [saveCurrentChat]);

  useEffect(() => {
    if (hasTrackedSession.current) return;
    hasTrackedSession.current = true;
    const trackVisit = async () => {
      try {
        const alreadyCounted = sessionStorage.getItem('smsai_visit_counted');
        const response = alreadyCounted
          ? await fetch('/api/visits')
          : await fetch('/api/visits', { method: 'POST' });
        const data = await response.json();
        if (!response.ok || typeof data.count !== 'number') throw new Error('visits unavailable');
        setSessionCount(data.count);
        setVisitsUnavailable(false);
        if (!alreadyCounted) sessionStorage.setItem('smsai_visit_counted', 'true');
      } catch (error) {
        console.error('Failed to track visit:', error);
        setVisitsUnavailable(true);
      }
    };
    trackVisit();

    const token = sessionStorage.getItem('smsai_session');
    if (!token) return;
    fetch('/api/auth', { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        if (!response.ok) {
          clearSession();
          return;
        }
        const data = await response.json();
        if (!data.user) return;
        applyUser(data.user, token);
        loadChats(data.user.wallet_address);
      })
      .catch(() => clearSession());
  }, [applyUser, loadChats]);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        // CoinGecko id "ore" is the official ORE mint from regolith-labs/ore:
        // oreoU2P8bN6jkk3jbaiVxYnG1dCXcYxwhwyK9jSybcp
        const cgData = await (await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana,bitcoin,ore&vs_currencies=usd&include_24hr_change=true')).json();
        if (cgData.solana) setSolPrice({ price: cgData.solana.usd, change: cgData.solana.usd_24h_change });
        if (cgData.bitcoin) setBtcPrice({ price: cgData.bitcoin.usd, change: cgData.bitcoin.usd_24h_change });
        if (cgData.ore) setOrePrice({ price: cgData.ore.usd, change: cgData.ore.usd_24h_change });
      } catch (error) {
        console.error('Failed to fetch prices:', error);
      }
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 300000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (messages.length <= 1) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!walletConnected || messages.length <= 1) return undefined;
    const timeout = setTimeout(() => saveCurrentChat(), 3000);
    return () => clearTimeout(timeout);
  }, [messages, walletConnected, saveCurrentChat]);

  const isInWalletBrowser = () => !!(window.solana?.isPhantom || window.solflare || window.backpack || findJupiterWallet());

  const connectWallet = async (walletName) => {
    try {
      const walletConfig = walletOptions.find((wallet) => wallet.id === walletName);
      if (!walletConfig) {
        alert('Unknown wallet type.');
        return;
      }
      let publicKey;

      if (walletConfig.isMwa) {
        const mwaWallet = findMwaWallet();
        if (!mwaWallet) {
          alert('Seed Vault / Mobile Wallet Adapter is not available.\n\nThis wallet is only available on Solana Mobile devices with Seed Vault enabled.');
          return;
        }
        const connectFeature = mwaWallet.features['standard:connect'];
        if (!connectFeature) throw new Error('Wallet does not support connect');
        const result = await connectFeature.connect();
        if (result.accounts?.length) publicKey = result.accounts[0].address;
        else throw new Error('No accounts returned');
      } else if (walletName === 'jupiter') {
        const jupiterWallet = findJupiterWallet();
        if (!jupiterWallet) {
          if (isMobile && walletConfig.mobileLink) {
            window.location.href = walletConfig.mobileLink;
            return;
          }
          window.open(walletConfig.downloadUrl, '_blank');
          alert(`${walletConfig.name} was not detected.\n\n1. Install from the opened page\n2. Refresh this page\n3. Try again`);
          return;
        }
        const connectFeature = jupiterWallet.features['standard:connect'];
        if (!connectFeature) throw new Error('Wallet does not support connect');
        const result = await connectFeature.connect();
        if (result.accounts?.length) publicKey = result.accounts[0].address;
        else throw new Error('No accounts returned');
      } else {
        const walletObj = window[walletConfig.window];
        if (!walletObj || !walletConfig.check(walletObj)) {
          if (isMobile && walletConfig.mobileLink) {
            window.location.href = walletConfig.mobileLink;
            return;
          }
          window.open(walletConfig.downloadUrl, '_blank');
          alert(`${walletConfig.name} was not detected.\n\n1. Install from the opened page\n2. Refresh this page\n3. Try again`);
          return;
        }
        const response = await walletObj.connect();
        publicKey = walletName === 'solflare'
          ? (walletObj.publicKey || response?.publicKey)
          : (response?.publicKey || walletObj.publicKey);
        if (publicKey && typeof publicKey !== 'string') publicKey = publicKey.toString();
      }

      if (!publicKey) throw new Error('Could not find public key');
      const address = typeof publicKey === 'string' ? publicKey : publicKey.toString();

      const challengeResponse = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'challenge', wallet_address: address }),
      });
      const challenge = await challengeResponse.json();
      if (!challengeResponse.ok) throw new Error(challenge.error || 'Could not start sign-in.');

      const signature = await signWalletMessage(walletName, address, challenge.message);
      const verifyResponse = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          wallet_address: address,
          wallet_type: walletName,
          signature,
          nonce: challenge.nonce,
        }),
      });
      const verified = await verifyResponse.json();
      if (!verifyResponse.ok) throw new Error(verified.error || 'Sign-in was rejected.');

      applyUser(verified.user, verified.token);
      localStorage.setItem('smsai_wallet_type', walletName);
      setShowWalletPrompt(false);
      setShowWalletMenu(false);
      setConnectionMessage(verified.created
        ? 'Wallet connected. +20 XP welcome bonus.'
        : `Welcome back. You have ${verified.user.xp} XP.`);
      setTimeout(() => setConnectionMessage(''), 5000);
      loadChats(address);
    } catch (error) {
      console.error('Wallet connection error:', error);
      if (error.message?.includes('User rejected') || error.message?.includes('rejected')) alert('Connection cancelled.');
      else if (error.code === 4001) alert('Connection rejected. Please approve it in your wallet.');
      else alert(error.message || 'Connection failed.');
    }
  };

  const handleSubmit = async (promptText = null) => {
    const userMessage = promptText || input.trim();
    if (!userMessage || loading) return;
    if (!walletConnected && questionCount >= FREE_QUESTION_LIMIT) {
      setShowWalletPrompt(true);
      return;
    }
    const newMessages = [...messages, { role: 'user', content: userMessage, timestamp: new Date() }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    if (!walletConnected) setQuestionCount((count) => count + 1);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          messages: newMessages.slice(-10).map((message) => ({ role: message.role, content: message.content })),
          wallet_address: walletConnected ? walletAddress : null,
        }),
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || 'API request failed');
      if (data.xp_awarded) {
        setUserXP(data.xp);
        setQuestionCount(data.questions_asked);
      } else if (walletConnected && data.auth_error) {
        setConnectionMessage('Sign in again to earn XP for that question.');
        setTimeout(() => setConnectionMessage(''), 5000);
      }
      setMessages([...newMessages, {
        role: 'assistant',
        content: data.content || 'I received your message but could not generate a response. Please try again.',
        timestamp: new Date(),
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages([...newMessages, {
        role: 'assistant',
        content: 'I am having trouble connecting right now. Please try again in a moment.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      setLeaderboardLoading(true);
      setLeaderboardError('');
      const response = await fetch('/api/leaderboard');
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.leaderboard)) {
        throw new Error(data.error || 'Could not load the leaderboard.');
      }
      setLeaderboard(data.leaderboard);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      setLeaderboardError('The leaderboard could not be loaded.');
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const loadChat = (chat) => {
    try {
      const stored = typeof chat.messages === 'string' ? JSON.parse(chat.messages) : chat.messages;
      if (!Array.isArray(stored)) return;
      setMessages(stored.map((message) => ({ ...message, timestamp: new Date(message.timestamp) })));
      setCurrentChatId(chat.id);
      setShowChatHistory(false);
    } catch (error) {
      console.error('Could not open that chat:', error);
    }
  };

  const deleteChat = async (chatId, event) => {
    event.stopPropagation();
    try {
      await fetch(`/api/chats?chat_id=${chatId}&wallet_address=${walletAddress}`, { method: 'DELETE', headers: authHeaders() });
      setSavedChats((chats) => chats.filter((chat) => chat.id !== chatId));
      if (currentChatId === chatId) resetChat();
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  const startNewChat = () => {
    if (walletConnected && messages.length > 1) saveCurrentChat();
    setCurrentChatId(null);
    resetChat();
    setShowChatHistory(false);
  };

  const saveProfile = async ({ displayName: nextName, avatarId: nextAvatar }) => {
    setProfileSaving(true);
    setProfileError('');
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ display_name: nextName, avatar_id: nextAvatar }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save profile.');
      applyUser(data.user);
      setProfileOpen(false);
    } catch (error) {
      setProfileError(error.message);
    } finally {
      setProfileSaving(false);
    }
  };

  const visitLabel = visitsUnavailable
    ? 'Visits unavailable'
    : sessionCount == null
      ? 'Loading visits'
      : `${sessionCount.toLocaleString('en-US')} visits`;

  const gated = !walletConnected && questionCount >= FREE_QUESTION_LIMIT;

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0B0B] text-white">
      {connectionMessage && (
        <div className="fixed top-4 left-1/2 z-50 w-[min(92vw,24rem)] -translate-x-1/2">
          <div className="bg-[#161616] border border-white/10 rounded-2xl px-4 py-2.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#14F195]" />
            <span className="text-sm text-white/80">{connectionMessage}</span>
            <button type="button" onClick={() => setConnectionMessage('')} className="ml-auto text-[#8C8C8C]" aria-label="Dismiss"><X className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      )}

      {showLeaderboard && (
        <LeaderboardModal
          rows={leaderboard}
          loading={leaderboardLoading}
          error={leaderboardError}
          walletAddress={walletConnected ? walletAddress : ''}
          onClose={() => setShowLeaderboard(false)}
          onRefresh={loadLeaderboard}
          onConnect={() => { setShowLeaderboard(false); setShowWalletPrompt(true); }}
        />
      )}

      {showInfo && (
        <InfoModal
          onClose={() => setShowInfo(false)}
          onHelp={() => { setShowInfo(false); setShowHelp(true); }}
        />
      )}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} walletAddress={walletConnected ? walletAddress : ''} />}
      {profileOpen && (
        <ProfileModal
          mode={profileMode}
          initialName={displayName}
          initialAvatar={avatarId || ''}
          saving={profileSaving}
          error={profileError}
          onSave={saveProfile}
          onClose={() => setProfileOpen(false)}
          onDisconnect={disconnectWallet}
        />
      )}
      {showWalletPrompt && (
        <WalletModal
          wallets={walletOptions}
          isMobile={isMobile}
          inWalletBrowser={isInWalletBrowser()}
          hasMwa={Boolean(findMwaWallet())}
          onClose={() => setShowWalletPrompt(false)}
          onConnect={(id) => { haptic(); connectWallet(id); }}
        />
      )}

      {showChatHistory && walletConnected && (
        <div className="fixed inset-0 bg-black/70 z-50 flex" onClick={() => setShowChatHistory(false)}>
          <div className="bg-[#0B0B0B] border-r border-white/10 w-72 max-w-[80vw] h-full p-5 overflow-y-auto" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-white">History</h3>
              <button type="button" onClick={() => setShowChatHistory(false)} aria-label="Close history"><X className="w-5 h-5 text-[#8C8C8C]" /></button>
            </div>
            <button type="button" onClick={startNewChat} className="w-full bg-gradient-to-r from-[#9945FF] to-[#14F195] text-[#0B0B0B] font-semibold rounded-xl px-3 py-2.5 text-sm flex items-center justify-center gap-2 mb-5">
              <Plus className="w-4 h-4" /> New Chat
            </button>
            {savedChats.length === 0 ? <p className="text-[#8C8C8C] text-sm text-center mt-8">No saved chats yet</p> : (
              <div className="space-y-1.5">
                {savedChats.map((chat) => (
                  <div key={chat.id} onClick={() => loadChat(chat)} className="p-3 rounded-xl cursor-pointer group border border-transparent hover:bg-white/5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-white/80 text-sm truncate">{chat.title}</p>
                        <p className="text-[#8C8C8C] text-xs mt-0.5">{new Date(chat.updated_at).toLocaleDateString()}</p>
                      </div>
                      <button type="button" onClick={(event) => deleteChat(chat.id, event)} className="text-[#8C8C8C] hover:text-red-300" aria-label="Delete chat"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0B0B0B]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
          <p id="visit-count" className="text-left text-xs sm:text-sm text-[#8C8C8C] tabular-nums">{visitLabel}</p>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4 min-w-0">
            <img src="/brand/logo-wordmark-white.png" alt="Solana Made Simple" className="wordmark" />
            <div>
              <p className="font-display font-bold text-white text-base sm:text-xl leading-none">SMSai</p>
              <p className="text-[#8C8C8C] text-[11px] sm:text-sm mt-1">Your AI Guide to Solana</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 ml-auto">
            {walletConnected && (
              <button type="button" onClick={() => { haptic(); setShowChatHistory(true); }} className="border border-white/10 rounded-xl p-2 text-[#8C8C8C]" aria-label="Chat history">
                <MessageSquare className="w-4 h-4" />
              </button>
            )}
            <button type="button" onClick={() => setShowInfo(true)} className="border border-white/10 rounded-xl px-3 py-2 text-xs text-white/80">About</button>
            <button type="button" onClick={() => setShowHelp(true)} className="border border-white/10 rounded-xl px-3 py-2 text-xs text-white/80">Get Help</button>
            <button type="button" onClick={() => { haptic(); setShowLeaderboard(true); loadLeaderboard(); }} className="border border-[#9945FF]/40 rounded-xl px-3 py-2 text-xs text-[#9945FF] flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-[#14F195]" /> Leaderboard
            </button>
            <div ref={walletMenuRef} className="relative">
              {walletConnected ? (
                <>
                  <button type="button" onClick={() => setShowWalletMenu((open) => !open)} className="border border-white/10 rounded-full px-3 py-1.5 flex items-center gap-2">
                    <span className="text-left">
                      <span className="block text-xs text-white">{displayName || shortenAddress(walletAddress)}</span>
                      <span className="block text-[10px] text-[#8C8C8C]">{userXP} XP · {questionCount} questions</span>
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#8C8C8C]" />
                  </button>
                  {showWalletMenu && (
                    <div className="absolute right-0 top-full mt-2 bg-[#161616] border border-white/10 rounded-xl min-w-40 z-30 overflow-hidden">
                      <button type="button" onClick={() => { setShowWalletMenu(false); setProfileMode(displayName ? 'edit' : 'setup'); setProfileOpen(true); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 flex items-center gap-2">
                        <User className="w-4 h-4" /> Profile
                      </button>
                      <button type="button" onClick={disconnectWallet} className="w-full text-left px-4 py-2.5 text-sm text-red-300 hover:bg-white/5 flex items-center gap-2">
                        <LogOut className="w-4 h-4" /> Disconnect
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <button type="button" onClick={() => { haptic(); setShowWalletPrompt(true); }} className="bg-gradient-to-r from-[#9945FF] to-[#14F195] text-[#0B0B0B] font-semibold rounded-full px-4 py-2 text-sm flex items-center gap-2">
                  <Wallet className="w-4 h-4" /> Connect
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-[#9945FF] to-[#14F195]" />
      </header>

      <div className="border-b border-white/10 bg-[#0B0B0B] px-4 py-2">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-center items-center gap-x-5 gap-y-1 sm:gap-x-10 text-xs">
          {solPrice && (
            <div className="flex items-center gap-2">
              <span className="tracking-widest text-[#9945FF]">SOL</span>
              <span className="tabular-nums">${solPrice.price.toFixed(2)}</span>
              <span className={solPrice.change >= 0 ? 'text-[#14F195]' : 'text-red-400'}>{solPrice.change >= 0 ? '+' : ''}{solPrice.change.toFixed(1)}%</span>
            </div>
          )}
          {btcPrice && (
            <div className="flex items-center gap-2">
              <span className="tracking-widest text-[#f7931a]">BTC</span>
              <span className="tabular-nums">${(btcPrice.price / 1000).toFixed(1)}k</span>
              <span className={btcPrice.change >= 0 ? 'text-[#14F195]' : 'text-red-400'}>{btcPrice.change >= 0 ? '+' : ''}{btcPrice.change.toFixed(1)}%</span>
            </div>
          )}
          {orePrice && (
            <div className="flex items-center gap-2">
              <span className="tracking-widest text-[#F5C542]">ORE</span>
              <span className="tabular-nums">${orePrice.price.toFixed(2)}</span>
              <span className={orePrice.change >= 0 ? 'text-[#14F195]' : 'text-red-400'}>{orePrice.change >= 0 ? '+' : ''}{orePrice.change.toFixed(1)}%</span>
            </div>
          )}
          <div className="hidden sm:block text-[#8C8C8C]">
            <span className="text-[#14F195] font-semibold">Free</span> · 5 questions · connect a wallet to keep asking
          </div>
        </div>
      </div>

      <div className="px-4 py-2 flex flex-wrap justify-center gap-4 text-[#8C8C8C]">
        {SOCIAL_LINKS.map((link) => (
          <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] hover:text-white">
            <link.Icon className="w-3.5 h-3.5" /> {link.label}
          </a>
        ))}
      </div>

      <main className="flex-1 px-3 sm:px-4 pt-2 pb-36">
        <div className="max-w-2xl mx-auto">
          <div className="sm:hidden mb-4 text-center text-[11px] text-[#8C8C8C]">
            <span className="text-[#14F195] font-semibold">Free</span> · 5 questions · connect a wallet to keep asking
          </div>

          {messages.length === 1 && (
            <div className="mb-6">
              <p className="text-[10px] sm:text-xs text-[#8C8C8C] mb-3 text-center tracking-widest uppercase">Quick start</p>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {quickStartQuestions.map((question) => (
                  <button
                    key={question.text}
                    type="button"
                    onClick={() => { haptic(); handleSubmit(question.text); }}
                    className="text-left flex items-center gap-2.5 px-3 py-3 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                  >
                    <span className="w-6 h-6 rounded-lg bg-[#9945FF] text-[#0B0B0B] flex items-center justify-center shrink-0">
                      {question.icon === 'wallet' ? <Wallet className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                    </span>
                    <span className="text-[11px] sm:text-sm text-white/80">{question.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {messages.map((message, index) => (
              <div key={`${message.timestamp}-${index}`} className={`flex gap-2.5 ${message.role === 'user' ? 'min-w-0 justify-end' : 'justify-start'}`}>
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-[#9945FF] text-[#0B0B0B] flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className={message.role === 'user' ? 'max-w-[85%] min-w-0 flex flex-col items-end' : 'max-w-[85%]'}>
                  {message.role === 'user' && walletConnected && (
                    <ChatUserIdentity name={displayName} avatarId={avatarId} address={walletAddress} />
                  )}
                  <div className={message.role === 'user' ? 'max-w-full' : undefined}>
                    <div
                      className="rounded-2xl px-4 py-3 text-sm leading-relaxed"
                      style={message.role === 'user'
                        ? { background: 'linear-gradient(135deg, #9945FF, #14F195)', color: '#0B0B0B' }
                        : { background: '#161616', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <ReactMarkdown className={`prose prose-sm max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0 ${message.role === 'user' ? 'prose-invert [&_strong]:text-black [&_a]:text-black' : 'prose-invert [&_a]:text-[#14F195] [&_code]:text-[#14F195]'}`}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    <p className="text-[10px] text-[#8C8C8C] mt-1 px-1 font-mono">{formatTime(message.timestamp)}</p>
                  </div>
                </div>
                {message.role === 'user' && !walletConnected && (
                  <div className="w-8 h-8 rounded-xl border border-white/10 flex items-center justify-center shrink-0"><User className="w-3.5 h-3.5 text-[#8C8C8C]" /></div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#9945FF] flex items-center justify-center"><Sparkles className="w-3.5 h-3.5 text-[#0B0B0B]" /></div>
                <div className="rounded-2xl px-4 py-3 bg-[#161616] border border-white/10 text-[#8C8C8C] text-sm">Thinking...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-[#0B0B0B]/95 backdrop-blur p-3 z-20">
        <div className="max-w-2xl mx-auto">
          {!walletConnected && questionCount > 0 && questionCount < FREE_QUESTION_LIMIT && (
            <p className="text-center text-[11px] text-[#8C8C8C] mb-2">{FREE_QUESTION_LIMIT - questionCount} free question{FREE_QUESTION_LIMIT - questionCount === 1 ? '' : 's'} left</p>
          )}
          {gated && (
            <div className="text-center mb-2">
              <button type="button" onClick={() => setShowWalletPrompt(true)} className="bg-gradient-to-r from-[#9945FF] to-[#14F195] text-[#0B0B0B] font-semibold rounded-lg px-4 py-1.5 text-sm">
                5 free questions used. Connect to continue
              </button>
            </div>
          )}
          <div className="flex gap-2">
            {messages.length > 1 && (
              <button type="button" onClick={() => { haptic(); startNewChat(); }} className="border border-white/10 rounded-xl px-3 text-[#8C8C8C]" aria-label="New chat"><Home className="w-4 h-4" /></button>
            )}
            <form onSubmit={(event) => { event.preventDefault(); handleSubmit(); }} className="flex-1 flex gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={gated ? 'Connect a wallet to continue' : 'Ask about Solana'}
                disabled={loading || gated}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#9945FF] disabled:opacity-40"
              />
              <button type="submit" disabled={loading || !input.trim() || gated} onClick={() => haptic()} className="bg-gradient-to-r from-[#9945FF] to-[#14F195] text-[#0B0B0B] font-semibold rounded-xl px-4 disabled:opacity-30" aria-label="Send">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>
          <div className="flex justify-center gap-3 mt-2 text-[11px] text-[#8C8C8C]">
            <a href="/privacy.html" className="hover:text-white">Privacy</a>
            <a href="/terms.html" className="hover:text-white">Terms</a>
            <a href="/copyright.html" className="hover:text-white">Copyright</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
