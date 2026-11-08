export default function EmailUnavailable({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-end sm:items-center justify-center px-3 py-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-off-title"
        className="bg-[#161616] border border-white/10 rounded-3xl w-full max-w-md p-5 sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="email-off-title" className="font-display text-xl text-white mb-3">Continue with email</h2>
        <p className="text-sm text-white/80 mb-3">Email sign-in is not connected yet. Nothing was sent. Connect a wallet to keep asking and earn XP.</p>
        <p className="text-sm text-[#8C8C8C] mb-4">Phantom, Solflare, Backpack, and Seed Vault still work. When email sign-in is turned on, it creates a Solana wallet in SMSai. You will not have to install an extension first.</p>
        <button type="button" onClick={onClose} className="w-full min-h-11 bg-gradient-to-r from-[#9945FF] to-[#14F195] text-[#0B0B0B] font-semibold rounded-xl px-4 py-2.5 text-sm">
          Close
        </button>
      </div>
    </div>
  );
}
