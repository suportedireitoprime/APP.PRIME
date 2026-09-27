import React from 'react';
import brazilStatesMap from '@/lib/brazilStatesMap';

interface StateMapIconProps extends React.SVGProps<SVGSVGElement> {
  uf: string;
}

// Bounding box exata calculada para cada estado brasileiro com margem proporcional
const STATE_VIEWBOX_MAP: Record<string, string> = {
  ac: "-4.34 190.31 124.14 68.10",
  al: "556.62 218.53 52.01 28.34",
  ap: "297.31 10.64 82.48 93.17",
  am: "-7.42 40.04 293.77 202.89",
  ba: "422.72 208.76 154.12 168.75",
  ce: "505.93 122.33 70.74 85.09",
  df: "400.76 324.29 17.21 10.84",
  es: "500.22 362.00 37.32 60.16",
  go: "319.99 272.49 123.29 122.31",
  ma: "390.03 93.08 116.90 155.65",
  mt: "186.54 189.41 191.86 183.93",
  ms: "243.06 348.13 121.96 123.07",
  mg: "351.96 299.62 188.19 153.15",
  pa: "226.81 34.86 217.22 208.35",
  pb: "548.06 174.20 66.67 38.22",
  pr: "298.78 437.94 110.14 77.18",
  pe: "505.49 193.75 110.73 37.55",
  pi: "434.20 119.95 93.82 137.21",
  rj: "452.66 409.92 65.76 46.59",
  rn: "550.43 155.77 61.40 36.23",
  rs: "251.24 513.94 133.30 129.65",
  ro: "107.88 202.97 117.62 96.93",
  rr: "140.19 -3.90 99.99 112.30",
  sc: "311.58 497.23 92.18 63.99",
  sp: "320.04 391.45 151.65 100.45",
  se: "557.24 229.27 31.01 34.86",
  to: "360.23 157.18 84.01 138.36",
};

export function StateMapIcon({ uf, className, ...props }: StateMapIconProps) {
  const ufLower = (uf || '').toLowerCase().trim();
  
  const stateData = brazilStatesMap.locations.find((loc: { id: string, name: string, path: string, viewBox?: string }) => loc.id === ufLower);

  if (!stateData) {
    // Fallback genérico quando for nacional ou não encontrado
    return (
      <div className={`flex items-center justify-center bg-emerald-500/20 rounded-full font-bold text-emerald-400 text-[11px] sm:text-[13px] tracking-wide ${className}`}>
        {uf?.toUpperCase() || 'BR'}
      </div>
    );
  }

  // viewBox exata por estado
  const viewBox = STATE_VIEWBOX_MAP[ufLower] || stateData.viewBox || "0 0 100 100";

  return (
    <div className={`relative flex items-center justify-center shrink-0 select-none ${className}`}>
      <svg
        viewBox={viewBox}
        className="absolute inset-0 w-full h-full text-emerald-500/35 opacity-90 drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
        fill="currentColor"
        {...props}
      >
        <path d={stateData.path} vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="relative z-10 text-[16px] sm:text-[18px] font-black text-emerald-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] tracking-wider">
        {uf.toUpperCase()}
      </span>
    </div>
  );
}
