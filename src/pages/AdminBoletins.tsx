import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Sparkles, Play } from 'lucide-react';
import BoletimPlayer, { type BoletimScene } from '@/components/boletim/BoletimPlayer';

const VOZES = [
  { id: 'Sulafat', label: 'Sulafat — Feminina, calorosa' },
  { id: 'Kore', label: 'Kore — Feminina, firme' },
  { id: 'Aoede', label: 'Aoede — Feminina, leve' },
  { id: 'Leda', label: 'Leda — Feminina, jovem' },
  { id: 'Zephyr', label: 'Zephyr — Feminina, brilhante' },
  { id: 'Autonoe', label: 'Autonoe — Feminina, animada' },
  { id: 'Laomedeia', label: 'Laomedeia — Feminina, alegre' },
  { id: 'Puck', label: 'Puck — Masculina, animada' },
  { id: 'Charon', label: 'Charon — Masculina, grave' },
  { id: 'Fenrir', label: 'Fenrir — Masculina, energética' },
  { id: 'Algenib', label: 'Algenib — Masculina, entusiasta' },
];

export default function AdminBoletins() {
  const navigate = useNavigate();
  const [cfg, setCfg] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [boletins, setBoletins] = useState<any[]>([]);
  const [player, setPlayer] = useState<{ id: string; scenes: any[]; youtubeUrl?: string; data_ref?: string } | null>(null);

  const load = async () => {
    const [c, b] = await Promise.all([
      supabase.from('boletim_config').select('*').eq('id', 1).maybeSingle(),
      supabase.from('boletins_juridicos').select('*').order('created_at', { ascending: false }).limit(40),
    ]);
    setCfg(c.data);
    // Deduplica por data_ref + tipo, mantendo o mais recente (a query já vem desc).
    const seen = new Set<string>();
    const unique = (b.data || []).filter((row: any) => {
      const key = `${row.data_ref}::${row.tipo || 'juridico'}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    setBoletins(unique);
  };


  useEffect(() => { load(); }, []);

  const salvar = async () => {
    setSaving(true);
    const { error } = await supabase.from('boletim_config').update({
      voz_id: cfg.voz_id,
      voz_genero: cfg.voz_genero,
      prompt_tts_extra: cfg.prompt_tts_extra,
      horario_geracao: cfg.horario_geracao,
      max_normas: cfg.max_normas,
      ativo: cfg.ativo,
      enviar_push: cfg.enviar_push,
      noticias_ativo: cfg.noticias_ativo,
      noticias_horario: cfg.noticias_horario,
      noticias_voz_id: cfg.noticias_voz_id,
      noticias_max_itens: cfg.noticias_max_itens,
      noticias_prompt_tts_extra: cfg.noticias_prompt_tts_extra,
    }).eq('id', 1);

    if (error) {
      toast.error(error.message);
      setSaving(false);
      return;
    }

    // Após salvar, chama a Edge Function para atualizar o pg_cron
    toast.info('Atualizando horários de notificação no servidor...');
    const { error: cronError } = await supabase.functions.invoke('boletim-cron-deploy', {
      body: {
        juridico_cron: cfg.horario_geracao,
        noticias_cron: cfg.noticias_horario,
      }
    });
    
    setSaving(false);
    if (cronError) {
      toast.error('Erro ao atualizar cron: ' + cronError.message);
    } else {
      toast.success('Configuração e Cron atualizados com sucesso!');
    }
  };

  const gerarAgora = async () => {
    setGerando(true);
    toast.info('Gerando boletim... isso leva ~1 min');
    const { data, error } = await supabase.functions.invoke('boletim-juridico-gerar', { body: {} });
    setGerando(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Boletim gerado (${data.cenas} cenas, ${data.duracao_s}s)`);
    load();
  };

  const [gerandoNoticias, setGerandoNoticias] = useState(false);
  const gerarNoticias = async () => {
    setGerandoNoticias(true);
    toast.info('Gerando boletim de notícias… ~1 min');
    const { data, error } = await supabase.functions.invoke('boletim-noticias-gerar', { body: {} });
    setGerandoNoticias(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Boletim de notícias gerado (${data.cenas} cenas, ${data.duracao_s}s)`);
    load();
  };


  const header = <PageHeader title="Boletins Jurídicos" subtitle="Configuração e geração" onBack={() => navigate('/admin-funcoes')} />;

  if (!cfg) return <DesktopPageLayout activeId="ferramentas" title="Boletins Jurídicos" mobileHeader={header}><div className="p-6 text-center opacity-60">Carregando…</div></DesktopPageLayout>;

  return (
    <DesktopPageLayout activeId="ferramentas" title="Boletins Jurídicos" mobileHeader={header}>
      <div className="px-4 sm:px-6 py-4 lg:px-0 space-y-6">
        {/* Ação principal */}
        <div className="rounded-2xl p-5 bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/30">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="w-6 h-6 text-primary" />
            <div>
              <p className="font-display font-bold text-lg">Gerar boletim de hoje</p>
              <p className="text-xs text-muted-foreground">Roteiro + narração TTS · usa até {cfg.max_normas} normas recentes</p>
            </div>
          </div>
          <Button onClick={gerarAgora} disabled={gerando} size="lg" className="w-full">
            {gerando ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gerando…</> : 'Gerar agora'}
          </Button>
        </div>

        {/* Boletim de Notícias */}
        <div className="rounded-2xl p-5 bg-gradient-to-br from-red-600/15 to-red-600/5 border border-red-600/30 space-y-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-red-500" />
            <div>
              <p className="font-display font-bold text-lg">Boletim de Notícias</p>
              <p className="text-xs text-muted-foreground">
                Top {cfg.noticias_max_itens || 10} manchetes do dia com lead persuasivo · gera às {String(cfg.noticias_horario || '07:00:00').slice(0, 5)}
              </p>
            </div>
          </div>
          <Button onClick={gerarNoticias} disabled={gerandoNoticias} size="lg" className="w-full bg-red-600 hover:bg-red-700 text-white">
            {gerandoNoticias ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gerando…</> : 'Gerar notícias de hoje'}
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Voz (notícias)</Label>
              <Select value={cfg.noticias_voz_id || 'Kore'} onValueChange={(v) => setCfg({ ...cfg, noticias_voz_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VOZES.map(v => <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Horário</Label>
              <Input type="time" value={String(cfg.noticias_horario || '07:00:00').slice(0, 5)} onChange={(e) => setCfg({ ...cfg, noticias_horario: e.target.value + ':00' })} />
            </div>
          </div>
          <div>
            <Label>Manchetes por boletim</Label>
            <Input type="number" min={3} max={15} value={cfg.noticias_max_itens || 10} onChange={(e) => setCfg({ ...cfg, noticias_max_itens: parseInt(e.target.value) || 10 })} />
          </div>
          <div>
            <Label>Prompt de entonação (TTS)</Label>
            <Textarea rows={3} value={cfg.noticias_prompt_tts_extra || ''} onChange={(e) => setCfg({ ...cfg, noticias_prompt_tts_extra: e.target.value })} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Ativo (gera todo dia automaticamente)</Label>
            <Switch checked={!!cfg.noticias_ativo} onCheckedChange={(v) => setCfg({ ...cfg, noticias_ativo: v })} />
          </div>
          <Button onClick={salvar} disabled={saving} className="w-full">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando & Fazendo Deploy…</> : 'Salvar & Fazer Deploy dos Horários'}
          </Button>
        </div>

        {/* Configuração */}
        <div className="rounded-2xl p-5 bg-card border border-border space-y-4">
          <p className="font-display font-bold">Configuração</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Voz</Label>
              <Select value={cfg.voz_id} onValueChange={(v) => setCfg({ ...cfg, voz_id: v, voz_genero: v === 'Puck' || v === 'Charon' || v === 'Fenrir' || v === 'Algenib' ? 'masculina' : 'feminina' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VOZES.map(v => <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Horário</Label>
              <Input type="time" value={String(cfg.horario_geracao).slice(0, 5)} onChange={(e) => setCfg({ ...cfg, horario_geracao: e.target.value + ':00' })} />
            </div>
          </div>

          <div>
            <Label>Máximo de normas</Label>
            <Input type="number" min={1} max={10} value={cfg.max_normas} onChange={(e) => setCfg({ ...cfg, max_normas: parseInt(e.target.value) || 6 })} />
          </div>

          <div>
            <Label>Prompt de entonação (TTS)</Label>
            <Textarea rows={4} value={cfg.prompt_tts_extra} onChange={(e) => setCfg({ ...cfg, prompt_tts_extra: e.target.value })} />
          </div>

          <div className="flex items-center justify-between">
            <Label>Ativo (geração automática diária)</Label>
            <Switch checked={cfg.ativo} onCheckedChange={(v) => setCfg({ ...cfg, ativo: v })} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Enviar push quando pronto</Label>
            <Switch checked={cfg.enviar_push} onCheckedChange={(v) => setCfg({ ...cfg, enviar_push: v })} />
          </div>

          <Button onClick={salvar} disabled={saving} className="w-full">
            {saving ? 'Salvando…' : 'Salvar configuração'}
          </Button>
        </div>

        {/* Últimos boletins */}
        <div className="rounded-2xl p-4 sm:p-5 bg-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <p className="font-display font-bold">Últimos boletins</p>
            <span className="text-xs text-muted-foreground">{boletins.length} {boletins.length === 1 ? 'boletim' : 'boletins'}</span>
          </div>
          <div className="space-y-3">
            {boletins.map(b => {
              const isNoticias = b.tipo === 'noticias';
              const statusLabel =
                b.status === 'pronto' ? 'Pronto' :
                b.status === 'gerando' ? 'Gerando roteiro' :
                b.status === 'renderizando' ? 'Renderizando vídeo' :
                b.status === 'erro' ? 'Erro' : b.status;
              const statusColor =
                b.status === 'pronto' ? 'bg-emerald-500/15 text-emerald-500' :
                b.status === 'erro' ? 'bg-destructive/15 text-destructive' :
                'bg-amber-500/15 text-amber-500';
              const dataFmt = b.data_ref ? new Date(b.data_ref + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : '';
              return (
                <div key={b.id} className="flex flex-col gap-3 p-4 rounded-xl bg-muted/40 border border-border/50">
                  {/* Cabeçalho: título + tags */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${isNoticias ? 'bg-blue-500/15 text-blue-500' : 'bg-primary/15 text-primary'}`}>
                        {isNoticias ? 'Notícias' : 'Jurídico'}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${statusColor}`}>
                        {statusLabel}
                      </span>
                      {b.youtube_url && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-red-600/20 text-red-500 px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                          <Youtube className="w-3 h-3" /> YouTube
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-sm sm:text-base leading-snug break-words">{b.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {dataFmt}
                      {typeof b.duracao_s === 'number' && b.duracao_s > 0 && ` · ${b.duracao_s} segundos`}
                    </p>
                  </div>

                  {/* Ações */}
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" className="flex-1 sm:flex-none" onClick={() => setPlayer({ id: b.id, scenes: Array.isArray(b.roteiro_json) ? b.roteiro_json : [], youtubeUrl: b.youtube_url })}>
                      <Play className="w-4 h-4 mr-1.5" /> Ouvir
                    </Button>
                  </div>

                  {b.status === 'erro' && b.erro && (
                    <p className="text-xs text-destructive/90 break-words bg-destructive/5 rounded-lg p-2">
                      <strong>Erro:</strong> {b.erro}
                    </p>
                  )}
                </div>
              );
            })}
            {boletins.length === 0 && <p className="text-sm opacity-60">Nenhum boletim gerado ainda.</p>}
          </div>
        </div>

      </div>

      {player && <BoletimPlayer boletimId={player.id} dataRef={player.data_ref} scenes={player.scenes} youtubeUrl={player.youtubeUrl || undefined} onClose={() => setPlayer(null)} />}
    </DesktopPageLayout>
  );
}