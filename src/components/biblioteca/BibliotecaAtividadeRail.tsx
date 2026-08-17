import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Bookmark, Clock, BookOpen, FileUp, Lock, Heart } from 'lucide-react';
import { track } from '@/lib/analyticsEvents';
// FilePicker carregado via dynamic import no handleUploadPdf
import { useGatedFeature } from '@/hooks/useGatedFeature';
import PdfScrollReader from './PdfScrollReader';
import type { LivroNormalizado } from '@/lib/bibliotecaColecoes';
import {
  getFavoritos,
  getRecentes,
  subscribeTracking,
  pullBibliotecaTracking,
  type LivroSnapshot,
} from '@/lib/bibliotecaTracking';
import { readLeituraProgress } from '@/lib/leituraProgress';
import { pullLeituraProgress } from '@/lib/leituraProgressSync';

interface Props {
  onAbrirLivro: (livro: LivroNormalizado) => void;
}

const snapToNormalizado = (s: LivroSnapshot): LivroNormalizado => ({
  id: s.id,
  titulo: s.titulo,
  autor: s.autor ?? null,
  sobre: s.sobre ?? null,
  capa: s.capa ?? null,
  link: s.link ?? null,
  download: s.download ?? null,
  area: s.area ?? null,
  colecaoId: s.colecaoId,
});

type Aba = 'lendo' | 'favoritos' | 'recentes';

const ABAS: { id: Aba; label: string; icon: typeof BookOpen }[] = [
  { id: 'lendo', label: 'Lendo', icon: BookOpen },
  { id: 'favoritos', label: 'Favoritos', icon: Heart },
  { id: 'recentes', label: 'Recentes', icon: Clock },
];

/**
 * Coluna direita da Biblioteca no desktop: atividade do usuário —
 * leitura em andamento, favoritos e histórico recente.
 */
const BibliotecaAtividadeRail = ({ onAbrirLivro }: Props) => {
  const navigate = useNavigate();
  const [aba, setAba] = useState<Aba>('lendo');
  const [tick, setTick] = useState(0);
  const [customPdfUrl, setCustomPdfUrl] = useState<string | null>(null);
  const [customPdfTitle, setCustomPdfTitle] = useState<string>('');
  const gate = useGatedFeature('pdf_personalizado', 'default');

  useEffect(() => subscribeTracking(() => setTick((t) => t + 1)), []);
  useEffect(() => {
    void pullBibliotecaTracking().then(() => setTick((t) => t + 1));
    void pullLeituraProgress().then(() => setTick((t) => t + 1));
  }, []);

  const handleUploadPdf = async () => {
    gate.run(async () => {
      try {
        const { FilePicker } = await import('@capawesome/capacitor-file-picker');
        const result = await FilePicker.pickFiles({
          types: ['application/pdf'],
          multiple: false,
          readData: true,
        });
        const file = result.files[0];
        if (file && file.data) {
          setCustomPdfTitle(file.name || 'PDF Personalizado');
          setCustomPdfUrl(`data:application/pdf;base64,${file.data}`);
        }
      } catch (e) {
        console.log('User cancelled or error picking file', e);
      }
    });
  };

  const lendo = useMemo(() => readLeituraProgress(tick).slice(0, 12), [tick]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const favoritos = useMemo(() => getFavoritos().slice(0, 20), [tick]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const recentes = useMemo(() => getRecentes().slice(0, 20), [tick]);

  const lista: { snap: LivroSnapshot; percent?: number; legenda?: string }[] =
    aba === 'lendo'
      ? lendo.map((i) => ({
          snap: i.snap,
          percent: i.percent,
          legenda: i.total ? `Pág. ${i.index + 1} de ${i.total}` : `Pág. ${i.index + 1}`,
        }))
      : (aba === 'favoritos' ? favoritos : recentes).map((s) => ({
          snap: s,
          legenda: s.autor ?? undefined,
        }));

  return (
    <>
    <div className="sticky top-4 rounded-3xl border border-border/50 bg-card overflow-hidden">
      <div className="px-4 pt-4">
        <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-primary/90">
          Minha atividade
        </p>
        <div className="mt-3 grid grid-cols-3 gap-1 p-1 rounded-xl bg-secondary/40">
          {ABAS.map((a) => {
            const Icon = a.icon;
            const ativa = a.id === aba;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setAba(a.id)}
                className={`flex items-center justify-center gap-1.5 h-8 rounded-lg text-[11px] font-semibold transition-colors ${
                  ativa
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {a.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 max-h-[50vh] overflow-y-auto pb-2">
        {lista.length === 0 ? (
          <p className="px-4 py-8 text-xs text-muted-foreground text-center leading-relaxed">
            {aba === 'lendo'
              ? 'Você ainda não começou nenhuma leitura.'
              : aba === 'favoritos'
                ? 'Favorite livros para encontrá-los aqui.'
                : 'Os livros que você abrir aparecem aqui.'}
          </p>
        ) : (
          lista.map(({ snap, percent, legenda }) => (
            <button
              key={`${snap.colecaoId}:${snap.id}`}
              type="button"
              onClick={() => onAbrirLivro(snapToNormalizado(snap))}
              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-secondary/50 transition-colors group"
            >
              <span className="w-9 h-12 rounded-md overflow-hidden shrink-0 bg-muted border border-border/50">
                {snap.capa ? (
                  <img src={snap.capa} alt="" loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {snap.titulo}
                </span>
                {legenda && (
                  <span className="block text-[10px] text-muted-foreground truncate">{legenda}</span>
                )}
                {typeof percent === 'number' && (
                  <span className="mt-1 block h-1 rounded-full bg-secondary/70 overflow-hidden">
                    <span
                      className="block h-full bg-primary"
                      style={{ width: `${Math.min(100, Math.max(2, percent))}%` }}
                    />
                  </span>
                )}
              </span>
            </button>
          ))
        )}
      </div>

      <div className="p-3 border-t border-border/50 bg-secondary/10">
        <button
          onClick={handleUploadPdf}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-card hover:bg-secondary/50 border border-border/50 transition-colors relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
              <FileUp className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-[13px] font-bold text-foreground flex items-center gap-1.5">
                Personalizado
                {!gate.isPremium && <Lock className="w-2.5 h-2.5 text-muted-foreground" />}
              </p>
              <p className="text-[10px] text-muted-foreground">Leia seus PDFs</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground relative z-10" />
        </button>
      </div>
    </div>
      {customPdfUrl && (
        <PdfScrollReader
          url={customPdfUrl}
          titulo={customPdfTitle}
          onClose={() => {
            setCustomPdfUrl(null);
            setCustomPdfTitle('');
          }}
        />
      )}
      {gate.gateNode}
    </>
  );
};

export default BibliotecaAtividadeRail;
