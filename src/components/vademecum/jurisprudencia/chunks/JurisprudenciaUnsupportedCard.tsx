import React from 'react';
import { Scale, ExternalLink } from 'lucide-react';
import { tribunalClasses } from './jurisprudenciaConstants';

interface JurisprudenciaUnsupportedCardProps {
  nomeExibicao?: string;
  numeroLabel: string;
  artigoNumero: string;
  leiNomeBusca: string;
}

export const JurisprudenciaUnsupportedCard: React.FC<JurisprudenciaUnsupportedCardProps> = ({
  nomeExibicao,
  numeroLabel,
  artigoNumero,
  leiNomeBusca,
}) => {
  const buildBuscaExterna = (base: 'stf' | 'stj') => {
    const q = `"art. ${artigoNumero}" ${leiNomeBusca}`.trim();
    if (base === 'stf') {
      return `https://jurisprudencia.stf.jus.br/pages/search?base=acordaos&sinonimo=true&plural=true&page=1&pageSize=10&queryString=${encodeURIComponent(q)}&sort=_score&sortBy=desc`;
    }
    return `https://scon.stj.jus.br/SCON/pesquisar.jsp?b=ACOR&livre=${encodeURIComponent(q)}`;
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/60 bg-card p-5">
        <div className="flex items-center gap-2 mb-2">
          <Scale className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground">
            {nomeExibicao} — {numeroLabel}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          A jurisprudência da Constituição Federal (e de algumas leis) não é indexada pelo
          Corpus927. Consulte diretamente os portais oficiais do STF e STJ para este artigo:
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <a
            href={buildBuscaExterna('stf')}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-between gap-3 rounded-xl border p-4 transition-colors ${tribunalClasses('STF')} hover:opacity-90`}
          >
            <div>
              <div className="font-bold text-base">STF</div>
              <div className="text-xs opacity-80">Buscar acórdãos sobre este artigo</div>
            </div>
            <ExternalLink className="w-5 h-5" />
          </a>
          <a
            href={buildBuscaExterna('stj')}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-between gap-3 rounded-xl border p-4 transition-colors ${tribunalClasses('STJ')} hover:opacity-90`}
          >
            <div>
              <div className="font-bold text-base">STJ</div>
              <div className="text-xs opacity-80">Buscar acórdãos sobre este artigo</div>
            </div>
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>
      </div>
    </div>
  );
};
