import React, { useMemo, useState, Suspense, lazy } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getModuloPorId, 
  getModuloPorNumero, 
  TrilhaModuloAula,
  TrilhaModuloOficial
} from '@/data/aulasTrilhasModulosOficiais';
import { AulasModuloDedicadoView } from '@/components/aulas-interativas/AulasModuloDedicadoView';
import { AulaItem } from '@/data/aulasInterativasCatalogoCompleto';
import { DISCIPLINAS_CATALOGO } from '@/data/disciplinasAulasCatalogo';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';

const PlayerAulaNativo = lazy(() => 
  import('@/components/aulas-interativas/PlayerAulaNativo').then(m => ({ default: m.PlayerAulaNativo }))
);

export default function AulasModuloPage() {
  const { moduloId } = useParams<{ moduloId: string }>();
  const navigate = useNavigate();
  const [aulaAtiva, setAulaAtiva] = useState<AulaItem | null>(null);

  const modulo = useMemo<TrilhaModuloOficial | undefined>(() => {
    if (!moduloId) return undefined;
    const direct = getModuloPorId(moduloId);
    if (direct) return direct;
    const num = parseInt(moduloId.replace('modulo-', ''), 10);
    if (!isNaN(num)) return getModuloPorNumero(num);
    return undefined;
  }, [moduloId]);

  if (!modulo) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col items-center justify-center p-6 text-center">
        <PageHeader 
          title="MÓDULO NÃO ENCONTRADO"
          onBack={() => navigate('/aulas')}
          variant="dark"
        />
        <div className="py-20 space-y-4">
          <p className="text-zinc-400">O módulo informado não foi localizado.</p>
          <button
            type="button"
            onClick={() => navigate('/aulas')}
            className="px-5 py-2.5 rounded-xl bg-teal-500 text-black font-bold text-sm cursor-pointer shadow-lg"
          >
            Voltar para Trilhas
          </button>
        </div>
      </div>
    );
  }

  if (aulaAtiva) {
    const disc = DISCIPLINAS_CATALOGO.find(d => d.id === aulaAtiva.disciplinaId) || DISCIPLINAS_CATALOGO[0];
    return (
      <Suspense fallback={<div className="fixed inset-0 bg-[#0D0D0D] flex items-center justify-center text-white">Carregando aula...</div>}>
        <PlayerAulaNativo
          aula={aulaAtiva}
          disciplinaNome={disc.nome}
          corDestaque={disc.corDestaque}
          onVoltar={() => setAulaAtiva(null)}
          onConcluir={() => setAulaAtiva(null)}
        />
      </Suspense>
    );
  }

  return (
    <AulasModuloDedicadoView
      modulo={modulo}
      onVoltar={() => navigate(-1)}
      onIniciarAula={(item) => {
        if ('etapas' in item) {
          setAulaAtiva(item as AulaItem);
        } else {
          const discId = modulo.disciplinasIds[0] || 'penal';
          const synthesizedAula: AulaItem = {
            id: item.id,
            numeroAula: item.aulaNumeroOuTitulo,
            titulo: item.aulaNumeroOuTitulo,
            descricao: item.sobre,
            slug: item.id,
            etapas: 10,
            audioQtd: 1,
            imagensQtd: 1,
            urlHtmlR2: '',
            capaUrl: modulo.capaUrl || '',
            status: 'pronto',
            disciplinaId: discId,
            materiaId: `mat-${discId}-01`,
          };
          setAulaAtiva(synthesizedAula);
        }
      }}
      onSelecionarNoCatalogo={() => {
        navigate('/aulas');
      }}
    />
  );
}
