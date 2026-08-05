import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import VisuaisJuridicosSheet from '@/components/visuais/VisuaisJuridicosSheet';
import { SLUG_TIPO } from '@/lib/visuaisJuridicos/rotas';
import type { VisualCategoria, VisualTipo } from '@/lib/visuaisJuridicos/types';

export default function VisualJuridico() {
  const navigate = useNavigate();
  const location = useLocation();

  // Extrai os segmentos da URL a partir de /visuais
  // Ex.: /visuais/mapa-mental/materias/direito-administrativo
  const pathSegs = location.pathname.replace(/^\/visuais\/?/, '').split('/').filter(Boolean);

  let tipo: VisualTipo | undefined = undefined;
  let categoriaInicial: VisualCategoria | undefined = undefined;
  let itemSlugInicial: string | undefined = undefined;
  let temaSlugInicial: string | undefined = undefined;
  let formatoInvalido = false;

  if (pathSegs.length > 0) {
    const primeiro = pathSegs[0];
    if (SLUG_TIPO[primeiro]) {
      tipo = SLUG_TIPO[primeiro];
      const catRaw = pathSegs[1];
      if (catRaw === 'materias' || catRaw === 'leis' || catRaw === 'jurisprudencia') {
        categoriaInicial = catRaw;
      }
      itemSlugInicial = pathSegs[2];
      temaSlugInicial = pathSegs[3];
    } else if (primeiro === 'materias' || primeiro === 'leis' || primeiro === 'jurisprudencia') {
      // Se omitiu o formato e entrou direto na categoria (ex.: /visuais/materias)
      tipo = 'mapa_mental';
      categoriaInicial = primeiro;
      itemSlugInicial = pathSegs[1];
      temaSlugInicial = pathSegs[2];
    } else {
      formatoInvalido = true;
    }
  }

  const sair = () => {
    navigate('/', { replace: true });
  };

  const aoMudarRota = useCallback(
    (segs: string[]) => {
      const destino = segs.length ? ['/visuais', ...segs].join('/') : '/visuais';
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
          onClick={() => navigate('/visuais', { replace: true })}
          className="rounded-full bg-secondary/70 px-5 py-2 font-display text-sm font-bold uppercase tracking-wider text-foreground"
        >
          Ver todos os visuais
        </button>
      </div>
    );
  }

  return (
    <VisuaisJuridicosSheet
      key={tipo || 'root'}
      open
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
