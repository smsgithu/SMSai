// Pill shape matches the Solana School pill on solanamadesimple.com:
// 135deg #9945FF to #14F195, 30px tall, #0B0B0B text. No Solana logo.
// Solana School is not open yet, so that pill is a span with the default cursor.
// The Skool mark is public/brand/logo-skool.png, the official file, shown unaltered.

const HOME_URL = 'https://solanamadesimple.com';

const pillClassName = 'inline-flex max-w-full items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold leading-none text-[#0B0B0B] no-underline whitespace-nowrap shadow-[0_6px_18px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_20px_rgba(153,69,255,0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#9945FF]';

const schoolPillClassName = 'inline-flex max-w-full items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold leading-none text-[#0B0B0B] whitespace-nowrap shadow-[0_6px_18px_rgba(0,0,0,0.4)] cursor-default';

const pillStyle = {
  backgroundColor: '#9945FF',
  backgroundImage: 'linear-gradient(135deg, #9945FF 0%, #14F195 100%)',
  minHeight: '30px',
};

export function SolanaSchoolPill() {
  return (
    <span
      aria-disabled="true"
      className={schoolPillClassName}
      style={pillStyle}
    >
      <img src="/brand/logo-skool.png" alt="Skool" width="220" height="220" className="h-[18px] w-[18px] shrink-0" />
      Solana School · Coming soon
    </span>
  );
}

export function HomeBasePill() {
  return (
    <a
      href={HOME_URL}
      target="_blank"
      rel="noopener noreferrer"
      title="Home base"
      className={pillClassName}
      style={pillStyle}
    >
      Solana Made Simple
    </a>
  );
}
