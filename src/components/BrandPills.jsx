// Pill shape matches the Solana School pill on solanamadesimple.com:
// 135deg #9945FF to #14F195, 30px tall, #0B0B0B text. No Solana logo.
// The Skool mark is public/brand/logo-skool.png, the official file, shown unaltered.

const SCHOOL_URL = 'https://www.skool.com/solana-school';
const HOME_URL = 'https://solanamadesimple.com';

const pillClassName = 'inline-flex max-w-full items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold leading-none text-[#0B0B0B] no-underline whitespace-nowrap shadow-[0_6px_18px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_20px_rgba(153,69,255,0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#9945FF]';

const pillStyle = {
  backgroundColor: '#9945FF',
  backgroundImage: 'linear-gradient(135deg, #9945FF 0%, #14F195 100%)',
  minHeight: '30px',
};

export function SolanaSchoolPill() {
  return (
    <a
      href={SCHOOL_URL}
      target="_blank"
      rel="noopener noreferrer"
      title="Free to join"
      className={pillClassName}
      style={pillStyle}
    >
      <img src="/brand/logo-skool.png" alt="Skool" width="220" height="220" className="h-[18px] w-[18px] shrink-0" />
      Solana School
    </a>
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
