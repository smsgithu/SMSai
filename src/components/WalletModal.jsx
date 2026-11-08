import { ExternalLink, Sparkles, Wallet, X } from 'lucide-react';

export default function WalletModal({ wallets, isMobile, inWalletBrowser, hasMwa, onClose, onConnect, linkMode = false }) {
  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 px-4 py-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-title"
        className="bg-[#161616] border border-white/10 rounded-3xl p-6 max-w-sm w-full max-h-[85vh] overflow-y-auto relative"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-[#8C8C8C] hover:text-white" aria-label="Close"><X className="w-5 h-5" /></button>
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-[#9945FF]/20 border border-[#9945FF]/30">
            <Wallet className="w-6 h-6 text-[#9945FF]" />
          </div>
          <h2 id="wallet-title" className="text-xl font-display text-white mb-2">{linkMode ? 'Link a wallet' : 'Connect Wallet'}</h2>
          <p className="text-white/70 text-sm mb-1">{linkMode ? 'Prove you control this wallet. XP and balances stay separate.' : 'Connect to keep asking and earn XP.'}</p>
          <p className="text-[#8C8C8C] text-xs mb-5">{linkMode ? 'You will sign a link message. It does not move funds, and it does not combine scores.' : 'You will sign a message so SMSai knows this wallet is yours. That signature does not move funds.'}</p>

          {isMobile && !inWalletBrowser && (
            <div className="bg-[#0B0B0B] border border-white/10 rounded-xl p-3 mb-4 text-left">
              <p className="text-xs text-[#14F195]">On a phone, tap a wallet to open this site in that wallet browser.</p>
            </div>
          )}

          {hasMwa && (
            <div className="bg-[#0B0B0B] border border-[#14F195]/30 rounded-2xl p-4 mb-4">
              <p className="text-xs font-medium mb-3 text-[#14F195]">Solana Mobile detected</p>
              <button type="button" onClick={() => onConnect('seedvault')} className="w-full bg-gradient-to-r from-[#9945FF] to-[#14F195] text-[#0B0B0B] font-semibold rounded-xl px-4 py-3 text-sm">
                Seed Vault
              </button>
            </div>
          )}

          <div className="space-y-2 mb-5">
            {wallets.filter((wallet) => !wallet.isMwa).map((wallet) => (
              <button key={wallet.id} type="button" onClick={() => onConnect(wallet.id)} className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 rounded-xl px-4 py-3 text-sm flex items-center justify-center gap-2">
                <Wallet className="w-4 h-4 text-[#9945FF]" />
                {wallet.name}
                {isMobile && !inWalletBrowser && <ExternalLink className="w-3 h-3 text-white/30" />}
              </button>
            ))}
          </div>

          <div className="bg-[#0B0B0B] border border-white/10 rounded-2xl p-4 mb-4 text-left">
            <h3 className="text-white font-medium text-sm mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#9945FF]" />
              New wallet in a few minutes
            </h3>
            <ol className="text-xs text-[#8C8C8C] space-y-2">
              <li>1. Pick a wallet above and install it.</li>
              <li>2. Create a new wallet.</li>
              <li>3. Save your seed phrase offline. SMSai will never ask for it.</li>
              <li>4. Come back and connect.</li>
            </ol>
          </div>

          <button type="button" onClick={onClose} className="w-full border border-white/10 text-[#8C8C8C] rounded-xl px-4 py-2.5 text-sm">Maybe later</button>
        </div>
      </div>
    </div>
  );
}
