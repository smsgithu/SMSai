import { Loader2, Medal, Trophy, X } from 'lucide-react';
import { leaderboardLabel, shortenAddress } from '../../shared/product.js';
import AvatarBadge from './AvatarBadge.jsx';

function RankIcon({ index }) {
  if (index === 0) return <Trophy className="w-4 h-4 text-[#14F195]" />;
  if (index === 1) return <Medal className="w-4 h-4 text-[#8C8C8C]" />;
  if (index === 2) return <Medal className="w-4 h-4 text-amber-600" />;
  return <span className="text-xs text-[#9945FF] w-4 text-center font-mono">{index + 1}</span>;
}

export default function LeaderboardModal({ rows, loading, error, walletAddress, onClose, onRefresh, onConnect }) {
  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="board-title"
        className="bg-[#161616] border border-white/10 rounded-3xl p-5 sm:p-6 max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <h2 id="board-title" className="text-white font-display text-lg flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#14F195]" />
            Leaderboard
          </h2>
          <button type="button" onClick={onClose} className="text-[#8C8C8C] hover:text-white" aria-label="Close leaderboard"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-xs text-[#8C8C8C] mb-4">Top 50 by XP. A profile name shows when it is set. Otherwise you see a shortened wallet address.</p>
        <div className="flex-1 overflow-y-auto space-y-1.5">
          {error && !loading ? (
            <p className="text-center text-sm text-[#8C8C8C] py-10">{error}</p>
          ) : loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-[#9945FF]" /></div>
          ) : rows.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-[#8C8C8C] text-sm mb-4">No XP yet. Connect a wallet, set your name, and ask a question.</p>
              {!walletAddress && (
                <button type="button" onClick={onConnect} className="bg-gradient-to-r from-[#9945FF] to-[#14F195] text-[#0B0B0B] font-semibold rounded-xl px-5 py-2.5 text-sm">
                  Connect Wallet
                </button>
              )}
            </div>
          ) : rows.map((user, index) => {
            const label = leaderboardLabel(user);
            const isYou = walletAddress === user.wallet_address;
            return (
              <div
                key={user.wallet_address}
                className="flex items-center justify-between p-3 rounded-xl"
                style={isYou ? { background: 'rgba(153,69,255,0.12)', border: '1px solid rgba(153,69,255,0.35)' } : { background: 'rgba(255,255,255,0.03)' }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <RankIcon index={index} />
                  <AvatarBadge name={user.display_name} avatarId={user.avatar_id} address={user.wallet_address} size={28} />
                  <div className="min-w-0">
                    <p className="text-white text-sm truncate">{label} {isYou && <span className="text-[#14F195] text-[10px]">you</span>}</p>
                    {user.display_name && <p className="text-[#8C8C8C] text-[10px] font-mono">{shortenAddress(user.wallet_address)}</p>}
                  </div>
                </div>
                <div className="text-right shrink-0 pl-2">
                  <p className="text-[#14F195] text-sm font-semibold tabular-nums">{user.xp || 0} XP</p>
                  <p className="text-[#8C8C8C] text-[10px] tabular-nums">{user.questions_asked || 0} Qs</p>
                </div>
              </div>
            );
          })}
        </div>
        <button type="button" onClick={onRefresh} disabled={loading} className="mt-4 w-full border border-white/10 rounded-xl py-2 text-sm text-[#8C8C8C] hover:text-white disabled:opacity-40">
          Refresh
        </button>
      </div>
    </div>
  );
}
