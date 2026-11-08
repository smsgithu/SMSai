export default function InfoModal({ onClose, onHelp }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-end sm:items-center justify-center px-3 py-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-title"
        className="bg-[#161616] border border-white/10 rounded-3xl w-full max-w-lg max-h-[86vh] overflow-y-auto p-5 sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <h2 id="about-title" className="font-display text-xl text-white">About SMSai</h2>
          <button type="button" onClick={onClose} className="text-[#8C8C8C] hover:text-white text-sm">Close</button>
        </div>

        <div className="space-y-4 text-sm text-white/85 leading-relaxed">
          <section>
            <h3 className="font-display text-white mb-1">What SMSai is</h3>
            <p>SMSai is an AI guide to Solana from Solana Made Simple (SMS). It helps everyday people learn how Solana works, in simple words and without the jargon.</p>
          </section>
          <section>
            <h3 className="font-display text-white mb-1">How it works</h3>
            <p>You can ask 5 questions with no wallet. After that, connect Phantom, Solflare, Backpack, or a Solana Mobile wallet (Seed Vault through the Mobile Wallet Adapter). You can also continue with email when that option is turned on. Email creates a Solana wallet in SMSai. A signed-in wallet earns XP and can save chats.</p>
          </section>
          <section>
            <h3 className="font-display text-white mb-1">XP, profiles, and the leaderboard</h3>
            <p>The first time a wallet signs in, it earns 20 XP. Each question you ask while signed in earns 5 XP. The server counts both. You pick a display name for your profile, and you can edit it later. A profile needs a connected wallet. The leaderboard lists the top 50 by XP and shows your display name. If you have not set one, it shows a shortened wallet address.</p>
          </section>
          <section>
            <h3 className="font-display text-white mb-1">Quick start</h3>
            <p>The chips on the home screen are the same starting points as before: wallets, seed phrases, DeFi and staking, memecoins, what makes Solana fast, NFTs, DEXs, validators, SPL tokens, staying safe, Jupiter, and staking rewards.</p>
          </section>
          <section>
            <h3 className="font-display text-white mb-1">Where it runs</h3>
            <p>SMSai runs in the browser. It can also connect to Solana Mobile wallets, including Seed Vault, with the Mobile Wallet Adapter. We have not re-checked the official Solana dApp Store listing on a physical Seeker, so this page does not claim that listing is live.</p>
          </section>
          <section>
            <h3 className="font-display text-white mb-1">Stay safe</h3>
            <p>Never share your seed phrase, private key, or password. Not with SMSai. Not in a help ticket. Not with anyone who asks. A seed phrase can move everything in the wallet. SMSai will not ask for it. This is education, not financial advice.</p>
          </section>
          <section>
            <h3 className="font-display text-white mb-1">Get help</h3>
            <p>Open Get Help, pick a topic, and describe what happened. If Discord is connected, a reply comes from Solana Made Simple on Discord. If help is not connected yet, the form says so and does not send your note.</p>
            <button type="button" onClick={onHelp} className="mt-3 bg-gradient-to-r from-[#9945FF] to-[#14F195] text-[#0B0B0B] font-semibold rounded-xl px-4 py-2 text-sm">
              Get Help
            </button>
          </section>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10">
          <img src="/brand/logo-sms-signature-white.png" alt="SMS signature" className="signature-mark" />
          <p className="text-[#8C8C8C] text-xs mt-3">Solana Made Simple. Education only, not financial advice.</p>
        </div>
      </div>
    </div>
  );
}
