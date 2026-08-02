// Cartão de descoberta de recursos subutilizados.
//
// A auditoria mostrou dois recursos praticamente sem adoção (lembretes por
// local e gravador de voz) simplesmente porque ninguém os encontra. Aqui eles
// aparecem na home apenas para quem ainda não usou — e somem quando o usuário
// dispensa ou passa a usar.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Mic, X, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { logAreaEvent } from '@/lib/appEvents';

interface Sugestao {
  id: string;
  titulo: string;
  texto: string;
  cta: string;
  rota: string;
  Icon: typeof MapPin;
}

const SUGESTOES: Sugestao[] = [
  {
    id: 'lembretes_local',
    titulo: 'Lembretes por local',
    texto: 'Receba um aviso quando estiver perto do fórum, da faculdade ou do escritório.',
    cta: 'Criar meu primeiro lembrete',
    rota: '/lembretes/local',
    Icon: MapPin,
  },
  {
    id: 'gravador',
    titulo: 'Anotações por voz',
    texto: 'Grave uma ideia em audiência ou na aula e transcreva depois, sem digitar nada.',
    cta: 'Gravar uma anotação',
    rota: '/anotacoes/audio',
    Icon: Mic,
  },
];

const DISMISS_MS = 30 * 86400000;
const chaveDismiss = (id: string) => `vacatio:discovery-dismiss:${id}`;

function dispensadoRecentemente(id: string) {
  try {
    const v = localStorage.getItem(chaveDismiss(id));
    return !!v && Date.now() - Number(v) < DISMISS_MS;
  } catch {
    return false;
  }
}

export default function FeatureDiscoveryCard() {
  const navigate = useNavigate();
  const [sugestao, setSugestao] = useState<Sugestao | null>(null);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;

      const candidatas = SUGESTOES.filter((s) => !dispensadoRecentemente(s.id));
      if (!candidatas.length) return;

      // Só sugerimos o que a pessoa ainda não usou.
      const [{ count: locais }, { count: audios }] = await Promise.all([
        supabase.from('location_reminders').select('id', { count: 'exact', head: true }).eq('user_id', uid),
        supabase.from('audio_recordings').select('id', { count: 'exact', head: true }).eq('user_id', uid),
      ]);

      const usados = new Set<string>();
      if ((locais ?? 0) > 0) usados.add('lembretes_local');
      if ((audios ?? 0) > 0) usados.add('gravador');

      const escolhida = candidatas.find((s) => !usados.has(s.id));
      if (!cancelado && escolhida) {
        setSugestao(escolhida);
        logAreaEvent(`descoberta_${escolhida.id}_exibida`);
      }
    })();

    return () => { cancelado = true; };
  }, []);

  if (!sugestao) return null;
  const { Icon } = sugestao;

  const dispensar = () => {
    try { localStorage.setItem(chaveDismiss(sugestao.id), String(Date.now())); } catch { /* noop */ }
    logAreaEvent(`descoberta_${sugestao.id}_dispensada`);
    setSugestao(null);
  };

  const abrir = () => {
    logAreaEvent(`descoberta_${sugestao.id}_clicada`);
    navigate(sugestao.rota);
  };

  return (
    <div className="relative mb-3 overflow-hidden rounded-2xl border border-primary/25 bg-primary/5 p-4">
      <button
        onClick={dispensar}
        aria-label="Dispensar sugestão"
        className="absolute right-2 top-2 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
          <Icon className="h-5 w-5 text-primary" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold">{sugestao.titulo}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{sugestao.texto}</p>
          <button
            onClick={abrir}
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary"
          >
            {sugestao.cta} <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
