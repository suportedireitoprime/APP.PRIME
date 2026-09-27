import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MapasMentaisView from '@/components/mapas-mentais/MapasMentaisView';
import { SLUG_TIPO } from '@/lib/visuaisJuridicos/rotas';
import type { VisualCategoria, VisualTipo } from '@/lib/visuaisJuridicos/types';

export default function VisualJuridico() {
  const navigate = useNavigate();
  const location = useLocation();

  const pathSegs = location.pathname.replace(/^\/(mapas-mentais|visuais)\/?/, '').split('/').filter(Boolean);

  let tipo: VisualTipo | undefined = undefined;
  let categoriaInicial: VisualCategoria | undefined = undefined;
  let itemSlugInicial: string | undefined = undefined;
  let temaSlugInicial: string | undefined = undefined;
  let formatoInvalido = false;

  if (pathSegs.length > 0) {
    const primeiro = pathSegs[0];
    if (SLUG_TIPO[primeiro]) {
      tipo = SLUG_TIPO[primeiro];
      const catRaw = pathSegs[1]?.replace('-', '_');
      if (catRaw === 'materias' || catRaw === 'leis' || catRaw === 'jurisprudencia' || catRaw === 'codigos' || catRaw === 'estatutos' || catRaw === 'leis_especiais' || catRaw === 'previdenciario') {
        categoriaInicial = catRaw as VisualCategoria;
      }
      itemSlugInicial = pathSegs[2];
      temaSlugInicial = pathSegs[3];
    } else {
      const primeiroNorm = primeiro.replace('-', '_');
      if (primeiroNorm === 'materias' || primeiroNorm === 'leis' || primeiroNorm === 'jurisprudencia' || primeiroNorm === 'codigos' || primeiroNorm === 'estatutos' || primeiroNorm === 'leis_especiais' || primeiroNorm === 'previdenciario') {
        tipo = 'mapa_mental';
        categoriaInicial = primeiroNorm as VisualCategoria;
        itemSlugInicial = pathSegs[1];
        temaSlugInicial = pathSegs[2];
      } else {
        formatoInvalido = true;
      }
    }
  }

  const sair = () => {
    navigate('/', { replace: true });
  };

  const aoMudarRota = useCallback(
    (segs: string[]) => {
      const destino = segs.length ? ['/mapas-mentais', ...segs].join('/') : '/mapas-mentais';
      if (location.pathname !== destino) {
        navigate(destino, { replace: true });
      }
    },
    [location.pathname, navigate],
  );

  if (formatoInvalido) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <p className="font-body text-sm text-muted-foreground">Formato de visual não encontrado.</p>
        <button
          onClick={() => navigate('/mapas-mentais', { replace: true })}
          className="rounded-full bg-secondary/70 px-5 py-2 font-display text-sm font-bold uppercase tracking-wider text-foreground cursor-pointer"
        >
          Ver todos os mapas
        </button>
      </div>
    );
  }

  return (
    <MapasMentaisView
      key={tipo || 'root'}
      modo="page"
      tipoInicial={tipo}
      categoriaInicial={categoriaInicial}
      itemSlugInicial={itemSlugInicial}
      temaSlugInicial={temaSlugInicial}
      onClose={sair}
      onRotaChange={aoMudarRota}
    />
  );
}

