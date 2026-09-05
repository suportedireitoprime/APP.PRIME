import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Heart, X, BookOpen, Loader2, Trophy, Star, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import GeracaoAnimacaoOverlay from '@/components/vademecum/overlays/GeracaoAnimacaoOverlay';

import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import {
  carregarArtigos,
  gerarLicao,
  getLicao,
  getTrilha,
  salvarProgresso,
  type Exercicio,
} from "@/lib/leiSeca";
import { ExercicioRunner } from "@/components/lei-seca/ExercicioRunner";
import { playFeedbackSound, playTransitionSound } from "@/hooks/useFeedbackSound";
import leiSecaAcertoAsset from "@/assets/sounds/lei-seca-acerto.mp3.asset.json";
import { useGoBack } from '@/hooks/useGoBack';
import { useGatedFeature } from '@/hooks/useGatedFeature';

let leiSecaAcertoAudio: HTMLAudioElement | null = null;
function playLeiSecaAcerto() {
  try {
    if (!leiSecaAcertoAudio) {
      leiSecaAcertoAudio = new Audio(leiSecaAcertoAsset.url);
      leiSecaAcertoAudio.preload = "auto";
      leiSecaAcertoAudio.volume = 0.85;
    }
    leiSecaAcertoAudio.currentTime = 0;
    void leiSecaAcertoAudio.play().catch(() => {});
  } catch {}
}

export default function LeiSecaPlayer() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { user } = useAuth();

  const licaoQ = useQuery({ queryKey: ["lei-seca-licao", id], queryFn: () => getLicao(id), enabled: !!id });
  const trilhaQ = useQuery({
    queryKey: ["lei-seca-trilha", licaoQ.data?.trilha_slug],
    queryFn: () => getTrilha(licaoQ.data!.trilha_slug),
    enabled: !!licaoQ.data,
  });

  const [exercicios, setExercicios] = useState<Exercicio[] | null>(null);
  const [erroGerar, setErroGerar] = useState<string | null>(null);
  const [carregandoGen, setCarregandoGen] = useState(false);
  const gateLeiSeca = useGatedFeature('lei_seca_praticar', 'lei_seca', { scope: id || null });

  // Plano gratuito: 1 lição por dia (a mesma lição não conta duas vezes).
  useEffect(() => {
    if (!id || gateLeiSeca.loading) return;
    if (gateLeiSeca.blocked) gateLeiSeca.openGate();
    else void gateLeiSeca.run();
  }, [id, gateLeiSeca.loading, gateLeiSeca.blocked]);

  useEffect(() => {
    if (!licaoQ.data) return;
    if (licaoQ.data.exercicios && Array.isArray(licaoQ.data.exercicios) && licaoQ.data.exercicios.length > 0) {
      setExercicios(licaoQ.data.exercicios);
      return;
    }
    setCarregandoGen(true);
    setErroGerar(null);
    gerarLicao(licaoQ.data.id)
      .then((ex) => setExercicios(ex))
      .catch((e) => setErroGerar(e.message ?? String(e)))
      .finally(() => setCarregandoGen(false));
  }, [licaoQ.data]);

  const artigosQ = useQuery({
    queryKey: ["lei-seca-artigos", licaoQ.data?.id],
    enabled: !!licaoQ.data && !!trilhaQ.data,
    queryFn: () => carregarArtigos(trilhaQ.data!.lei_slug, licaoQ.data!.artigos),
  });

  const artigoMap = useMemo(() => {
    const m = new Map<string, string>();
    (artigosQ.data ?? []).forEach((a) => m.set(String(a.num), a.texto));
    return m;
  }, [artigosQ.data]);

  const [verArtigo, setVerArtigo] = useState(false);
  const [respondido, setRespondido] = useState(false);
  const [confirmarSair, setConfirmarSair] = useState(false);
  const [indice, setIndice] = useState(0);
  const [vidas, setVidas] = useState(3);
  const [acertos, setAcertos] = useState(0);
  const [respostas, setRespostas] = useState<boolean[]>([]);
  const [acabou, setAcabou] = useState<null | "vitoria" | "derrota">(null);

  const total = exercicios?.length ?? 0;
  const atual = exercicios?.[indice];
  const progressoPct = total ? Math.round((indice / total) * 100) : 0;

  function onResultado(certo: boolean) {
    if (certo) playLeiSecaAcerto();
    else playFeedbackSound("error");
    const novasResp = [...respostas, certo];
    const novasVidas = certo ? vidas : vidas - 1;
    const novosAcertos = certo ? acertos + 1 : acertos;

    setRespostas(novasResp);
    setVidas(novasVidas);
    setAcertos(novosAcertos);

    if (novasVidas <= 0) {
      setAcabou("derrota");
      finalizar(false, novosAcertos, novasResp.length);
    } else if (indice + 1 >= total) {
      setAcabou("vitoria");
      finalizar(true, novosAcertos, novasResp.length);
    } else {
      // pequena pausa pro som de acerto/erro terminar antes do swoosh
      setTimeout(() => playTransitionSound(), 320);
      setIndice((i) => i + 1);
    }
  }

  async function finalizar(venceu: boolean, certos: number, totalResp: number) {
    if (!user?.id || !licaoQ.data) return;
    const pontuacao = totalResp ? Math.round((certos / totalResp) * 100) : 0;
    let estrelas = 0;
    if (venceu) {
      estrelas = 1;
      if (vidas >= 2) estrelas = 2;
      if (certos === total) estrelas = 3;
    }
    try {
      await salvarProgresso(user.id, licaoQ.data.id, { estrelas, pontuacao, concluida: venceu });
    } catch (e: any) {
      toast({ title: "Erro salvando progresso", description: e.message, variant: "destructive" });
    }
  }

  function tentarNovamente() {
    setIndice(0);
    setVidas(3);
    setAcertos(0);
    setRespostas([]);
    setAcabou(null);
  }

  if (gateLeiSeca.blocked) {
    return (
      <div className="min-h-screen bg-background">
        {gateLeiSeca.gateNode}
      </div>
    );
  }

  if (licaoQ.isLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-br from-[#1a0612] via-brand-burgundy-deep to-[#1a0612]">
        <Loader2 className="h-10 w-10 animate-spin text-pink-400" />
      </div>
    );
  }
  if (!licaoQ.data) {
    return (
      <div className="min-h-screen grid place-items-center px-6 text-center bg-gradient-to-br from-[#1a0612] via-brand-burgundy-deep to-[#1a0612]">
        <div>
          <p className="text-white/70 mb-4">Esta lição não existe mais (a trilha foi reorganizada).</p>
          <Button onClick={() => navigate("/lei-seca")}>Voltar para Lei Seca</Button>
        </div>
      </div>
    );
  }
  if (carregandoGen) {
    return (
      <GeracaoAnimacaoOverlay
        open
        titulo="Preparando lição"
        steps={["Lendo o texto da lei", "Criando os exercícios", "Salvando a lição", "Pronto"]}
        stepRanges={[[0, 25], [25, 85], [85, 99], [100, 100]]}
        estTotalSec={45}
        onCancel={() => goBack()}
        cancelLabel="Cancelar"
      />
    );
  }
  if (erroGerar) {
    return (
      <div className="min-h-screen grid place-items-center px-6 text-center bg-gradient-to-br from-[#1a0612] via-brand-burgundy-deep to-[#1a0612]">
        <div>
          <p className="text-rose-300 mb-4">{erroGerar}</p>
          <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  if (acabou) {
    return (
      <div className="min-h-screen grid place-items-center px-6 text-center bg-gradient-to-br from-[#1a0612] via-brand-burgundy-deep to-[#1a0612]">
        <div className="max-w-md w-full">
          {acabou === "vitoria" ? (
            <>
              <Trophy className="h-20 w-20 mx-auto mb-4 text-amber-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]" />
              <h2 className="text-3xl font-bold mb-2 text-white">Lição concluída!</h2>
              <p className="text-white/70 mb-6">
                {acertos} de {total} acertos
              </p>
              <div className="flex justify-center gap-2 mb-8">
                {[0, 1, 2].map((i) => {
                  const ganhas = acertos === total ? 3 : vidas >= 2 ? 2 : 1;
                  return (
                    <Star
                      key={i}
                      className={`h-12 w-12 ${i < ganhas ? "text-amber-400 fill-amber-400" : "text-white/15"}`}
                    />
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <Heart className="h-20 w-20 mx-auto mb-4 text-rose-500" />
              <h2 className="text-3xl font-bold mb-2 text-white">Suas vidas acabaram</h2>
              <p className="text-white/70 mb-6">
                {acertos} de {respostas.length} respondidas corretamente
              </p>
            </>
          )}
          <div className="flex flex-col gap-2">
            <Button
              onClick={tentarNovamente}
              className="w-full bg-gradient-to-br from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 h-12 font-bold rounded-xl shadow-lg shadow-pink-600/30"
            >
              <RotateCw className="h-4 w-4 mr-2" /> Refazer
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/lei-seca/${licaoQ.data?.trilha_slug}/${licaoQ.data?.parte}`)}
              className="w-full border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.08]"
            >
              Voltar à trilha
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const artigoAtualTexto = atual ? artigoMap.get(String((atual as any).artigo)) ?? "" : "";

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#1a0612] via-brand-burgundy-deep to-[#120410]">
      {/* Header imersivo: X + progresso + vidas */}
      <div className="sticky top-0 z-30 bg-[#160510]/85 backdrop-blur-md border-b border-white/5 pt-[calc(0.5rem+var(--sai-top))]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setConfirmarSair(true)}
            aria-label="Sair da lição"
            className="h-11 w-11 min-h-[44px] min-w-[44px] -ml-1 grid place-items-center rounded-full bg-white/10 ring-1 ring-white/15 text-white/90 hover:text-white hover:bg-white/15 active:scale-95 transition touch-manipulation"
          >
            <X className="h-6 w-6" strokeWidth={2.4} />
          </button>

          <Progress
            value={progressoPct}
            className="flex-1 h-3 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-pink-400 [&>div]:to-rose-500 [&>div]:shadow-[0_0_12px_rgba(244,63,94,0.5)]"
          />
          <div className="flex items-center gap-1 font-bold text-white shrink-0">
            <Heart className="h-5 w-5 text-rose-500 fill-rose-500 drop-shadow-[0_0_6px_rgba(244,63,94,0.6)]" />
            <span>{vidas}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 pb-[calc(6rem+var(--sai-bottom))]">
        {atual && (
          <ExercicioRunner
            key={indice}
            exercicio={atual}
            artigoTexto={artigoAtualTexto}
            onRespondido={setRespondido}
            onResultado={onResultado}
          />
        )}
      </div>

      {/* Footer fixo */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#160510]/85 backdrop-blur-md border-t border-white/5 pb-[calc(0.75rem+var(--sai-bottom))]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-xs text-white/60">
            Exercício {indice + 1} de {total}
          </div>
          {respondido && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVerArtigo(true)}
            className="border-white/15 bg-white/[0.05] text-white hover:bg-white/[0.1] h-10 px-4 rounded-xl touch-manipulation font-bold"
          >
            <BookOpen className="h-4 w-4 mr-2" /> Ver artigo
          </Button>
          )}
        </div>
      </div>

      {/* Confirmar saída */}
      <AlertDialog open={confirmarSair} onOpenChange={setConfirmarSair}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair da lição?</AlertDialogTitle>
            <AlertDialogDescription>
              Seu progresso desta lição será perdido. Deseja realmente voltar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar lição</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                navigate(`/lei-seca/${licaoQ.data?.trilha_slug}/${licaoQ.data?.parte}`)
              }
              className="bg-rose-500 hover:bg-rose-600"
            >
              Voltar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={verArtigo} onOpenChange={setVerArtigo}>
        <SheetContent side="bottom" className="h-[75vh] overflow-y-auto pb-[calc(2rem+var(--sai-bottom))]">
          <SheetHeader>
            <SheetTitle>{trilhaQ.data?.nome}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            {artigosQ.data?.map((a) => (
              <div key={a.num} className="border-l-4 border-pink-500 pl-4">
                <div className="text-xs font-bold text-pink-400 mb-1">Art. {a.num}</div>
                <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground">{a.texto}</p>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
