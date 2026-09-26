import React from 'react';
import brazilStatesMap from '@/lib/brazilStatesMap';

interface StateMapIconProps extends React.SVGProps<SVGSVGElement> {
  uf: string;
}

export function StateMapIcon({ uf, className, ...props }: StateMapIconProps) {
  const ufLower = uf.toLowerCase();
  
  const stateData = brazilStatesMap.locations.find((loc: { id: string, name: string, path: string, viewBox?: string }) => loc.id === ufLower);

  if (!stateData) {
    // Fallback genérico
    return (
      <div className={`flex items-center justify-center bg-emerald-500/20 rounded-full font-bold text-emerald-400 text-[10px] ${className}`}>
        {uf.toUpperCase()}
      </div>
    );
  }

  // viewBox customizada calculada
  const viewBox = stateData.viewBox || "0 0 100 100";

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox={viewBox}
        className="absolute inset-0 w-full h-full text-emerald-500/30 opacity-70"
        fill="currentColor"
        {...props}
      >
        <path d={stateData.path} vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="relative z-10 text-[10px] font-bold text-emerald-300 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
        {uf.toUpperCase()}
      </span>
    </div>
  );
}
