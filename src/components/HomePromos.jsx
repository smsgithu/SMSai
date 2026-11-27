import { useState } from 'react';
import { HomeBasePill, SolanaSchoolPill } from './BrandPills.jsx';

// Hand-lettered Solana School art.
// This constant is the only path. Drop the file at public/solana-school-art.png.
// Expected source: 960 by 360 pixels (8:3), PNG, transparent or #0B0B0B.
// The slot is 40px tall on a phone and 56px tall from 640px up, full card width, object-contain, so the whole drawing stays visible.
// A wide wordmark fits that bar. If the file is missing, the dashed placeholder stays.
const SOLANA_SCHOOL_ART_SRC = '/solana-school-art.png';

function SolanaSchoolArt() {
  const [status, setStatus] = useState('pending');
  const missing = status !== 'ready';

  return (
    <div className="relative h-10 w-full sm:h-14">
      {missing && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl border border-dashed border-[#14F195] bg-[#0B0B0B] px-2 text-center text-[10px] leading-tight text-[#14F195] sm:text-[11px]">
          Solana School art goes here
        </div>
      )}
      {status !== 'missing' && (
        <img
          src={SOLANA_SCHOOL_ART_SRC}
          alt={status === 'ready' ? 'Solana School' : ''}
          className={status === 'ready' ? 'h-10 w-full rounded-xl object-contain sm:h-14' : 'absolute h-px w-px opacity-0'}
          onLoad={() => setStatus('ready')}
          onError={() => setStatus('missing')}
        />
      )}
    </div>
  );
}

export default function HomePromos() {
  return (
    <section aria-label="Solana Made Simple" className="mb-4 grid grid-cols-2 gap-2">
      <article className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <SolanaSchoolArt />
        <h2 className="mt-2 font-display text-sm font-semibold leading-tight text-white">Solana School</h2>
        <p className="mt-1 text-[11px] leading-snug text-white/80 sm:text-xs">
          Solana School is the onboarding and education course from Solana Made Simple. It leads into the five pillars and the wider Solana ecosystem.
        </p>
        <p className="mt-1 text-[10px] tracking-wide text-[#8C8C8C]">Spend, Save, Grow, Collect, Belong</p>
        <div className="mt-auto pt-2">
          <SolanaSchoolPill />
        </div>
      </article>

      <article className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <img
          src="/brand/logo-wordmark-white.png"
          alt=""
          className="h-10 w-auto max-w-full object-contain object-left sm:h-14"
        />
        <h2 className="mt-2 font-display text-sm font-semibold leading-tight text-white">Solana Made Simple</h2>
        <p className="mt-1 text-[11px] leading-snug text-white/80 sm:text-xs">
          SMSai is the entry point. It leads to the full Solana Made Simple site, the home base.
        </p>
        <div className="mt-auto pt-2">
          <HomeBasePill />
        </div>
      </article>
    </section>
  );
}
