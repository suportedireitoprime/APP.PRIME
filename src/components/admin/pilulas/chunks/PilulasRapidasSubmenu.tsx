import React from 'react';
import { ChevronRight } from 'lucide-react';
import { ScreenState } from './pilulasConstants';

interface PilulasRapidasSubmenuProps {
  counts: {
    cp: number;
    cf: number;
    cc: number;
    cpp: number;
    clt: number;
  };
  onSelectLei: (lei: ScreenState) => void;
}

export const PilulasRapidasSubmenu: React.FC<PilulasRapidasSubmenuProps> = ({
  counts,
  onSelectLei,
}) => {
  const leis: Array<{ id: ScreenState; label: string; count: number }> = [
    { id: 'cp', label: 'Código Penal', count: counts.cp },
    { id: 'cf', label: 'Constituição Federal', count: counts.cf },
    { id: 'cc', label: 'Código Civil', count: counts.cc },
    { id: 'cpp', label: 'Código de Processo Penal', count: counts.cpp },
    { id: 'clt', label: 'CLT', count: counts.clt },
  ];

  return (
    <div className="space-y-4">
      {leis.map((lei) => (
        <button
          key={lei.id}
          type="button"
          onClick={() => onSelectLei(lei.id)}
          className="w-full flex items-center justify-between px-5 py-4 bg-card rounded-2xl shadow-sm border border-border hover:bg-muted/30 transition-colors active:scale-[0.98]"
        >
          <span className="font-bold text-lg uppercase tracking-wider text-foreground">
            {lei.label} ({lei.count})
          </span>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      ))}
    </div>
  );
};
