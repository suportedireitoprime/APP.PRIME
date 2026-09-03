import icon from '@/assets/logo-direitoprime-v2.png';

interface Props {
  type: 'cover' | 'content';
  title: string;
  content?: string;
  image?: string;
  username?: string;
}

export default function InstagramSlide({ type, title, content, image, username }: Props) {
  return (
    <div 
      className="relative flex flex-col overflow-hidden w-[1080px] h-[1080px] select-none bg-black"
      style={{
        background: 'linear-gradient(135deg, hsl(28 35% 22%) 0%, hsl(24 40% 30%) 50%, hsl(20 45% 18%) 100%)',
      }}
    >
      {/* Texturas */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,220,180,0.18),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.45),transparent_65%)]" />

      {/* Ornamentos SVG */}
      <svg
        viewBox="0 0 200 200"
        className="absolute -left-6 -top-4 w-48 h-48 text-amber-300/25 pointer-events-none"
      >
        <g fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          <rect x="30" y="140" width="140" height="24" rx="3" />
          <rect x="45" y="112" width="120" height="24" rx="3" />
          <rect x="35" y="84" width="130" height="24" rx="3" />
          <line x1="55" y1="152" x2="55" y2="158" />
          <line x1="70" y1="124" x2="70" y2="130" />
          <line x1="60" y1="96" x2="60" y2="102" />
        </g>
      </svg>
      
      <svg
        viewBox="0 0 200 200"
        className="absolute right-6 top-8 w-40 h-40 text-amber-300/20 pointer-events-none"
      >
        <g fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="30" y="40" width="90" height="30" rx="4" transform="rotate(-25 75 55)" />
          <line x1="95" y1="95" x2="160" y2="160" />
          <rect x="120" y="150" width="60" height="14" rx="3" />
        </g>
      </svg>

      <svg
        viewBox="0 0 200 200"
        className="absolute left-10 bottom-32 w-32 h-32 text-amber-300/15 pointer-events-none"
      >
        <g fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 60 L100 80 L180 60 L180 160 L100 180 L20 160 Z" />
          <line x1="100" y1="80" x2="100" y2="180" />
        </g>
      </svg>

      {/* Conteúdo Principal */}
      <div className="relative z-10 flex-1 flex flex-col px-24 py-24">
        {type === 'cover' ? (
          <div className="flex-1 flex flex-col justify-center pb-24">
            <h1 className="text-[100px] font-bold text-amber-50 leading-[1.1] drop-shadow-xl w-[90%] font-display">
              {title}
            </h1>
          </div>
        ) : (
          <div className="flex-1 flex flex-col mt-12 pb-24">
            <h2 className="text-[72px] font-bold text-amber-300 leading-tight drop-shadow mb-12">
              {title}
            </h2>
            <p className="text-[52px] leading-[1.4] text-amber-50/95 font-serif italic max-w-full">
              {content}
            </p>
          </div>
        )}
      </div>

      {/* Imagem (Overlay) se for capa */}
      {type === 'cover' && image && (
        <div className="absolute inset-y-0 right-0 w-[55%] z-0 overflow-hidden pointer-events-none">
          <img
            src={image}
            alt=""
            className="absolute -right-10 bottom-0 h-[105%] w-auto object-contain object-bottom opacity-90 drop-shadow-[0_8px_32px_rgba(0,0,0,0.8)]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(20,45%,18%)] via-[hsl(20,45%,18%)]/60 to-transparent" />
        </div>
      )}

      {/* Footer com Logo e Username */}
      <div className="absolute bottom-12 left-24 right-24 flex items-center justify-between z-20 pointer-events-none">
        <div className="flex items-center gap-6">
          <img src={icon} alt="Logo" className="w-24 h-24 rounded-3xl shadow-xl border border-white/10" />
        </div>
        {username && (
          <div className="text-amber-200/90 text-[42px] font-semibold tracking-wide drop-shadow">
            {username}
          </div>
        )}
      </div>
    </div>
  );
}
