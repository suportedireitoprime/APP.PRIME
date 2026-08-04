import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bell, BellRing, Clock, MapPin, Loader2, Search, Navigation2, Trash2,
  Home, GraduationCap, Briefcase, Building2, Plus, Check, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { geocodeAddress, type GeocodeResult } from '@/lib/nativeGeocoder';
import { refreshGeofenceReminders, startGeofenceWatcher } from '@/lib/nativeGeofence';
import QuestoesBottomNav from '@/components/questoes/QuestoesBottomNav';
import { haptic } from '@/lib/nativeHaptics';
import { Capacitor } from '@capacitor/core';

const DIAS = [
  { id: 'seg', label: 'S', full: 'Seg' },
  { id: 'ter', label: 'T', full: 'Ter' },
  { id: 'qua', label: 'Q', full: 'Qua' },
  { id: 'qui', label: 'Q', full: 'Qui' },
  { id: 'sex', label: 'S', full: 'Sex' },
  { id: 'sab', label: 'S', full: 'Sáb' },
  { id: 'dom', label: 'D', full: 'Dom' },
];

const WEEKDAY_MAP: Record<string, number> = { dom: 1, seg: 2, ter: 3, qua: 4, qui: 5, sex: 6, sab: 7 };
const DIA_IDX: Record<string, number> = { dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6 };

const PRESETS: { label: string; dias: string[] }[] = [
  { label: 'Todos os dias', dias: ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] },
  { label: 'Dias úteis', dias: ['seg', 'ter', 'qua', 'qui', 'sex'] },
  { label: 'Fim de semana', dias: ['sab', 'dom'] },
];

const METAS = [5, 10, 20, 30, 50];

const LOCAIS = [
  { id: 'Casa', icon: Home },
  { id: 'Faculdade', icon: GraduationCap },
  { id: 'Estágio', icon: Briefcase },
  { id: 'Trabalho', icon: Building2 },
  { id: 'Outro', icon: MapPin },
];

const RADII = [100, 300, 500, 1000];

interface LocalRow {
  id: string;
  label: string;
  address: string | null;
  radius_m: number;
  active: boolean;
}

/** Próximo disparo (fuso do aparelho) a partir dos dias + hora. */
function proximoDisparo(dias: string[], horario: string): Date | null {
  const idxs = (dias || []).map((d) => DIA_IDX[d]).filter((n) => n !== undefined);
  if (!idxs.length) return null;
  const [hh, mm] = horario.split(':').map(Number);
  const now = new Date();
  for (let add = 0; add <= 8; add++) {
    const d = new Date(now.getTime() + add * 86400000);
    if (!idxs.includes(d.getDay())) continue;
    const fire = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hh, mm, 0, 0);
    if (fire.getTime() > now.getTime()) return fire;
  }
  return null;
}

function formatarProximo(d: Date | null) {
  if (!d) return null;
  const hoje = new Date();
  const mesmoDia = d.toDateString() === hoje.toDateString();
  const amanha = new Date(hoje.getTime() + 86400000).toDateString() === d.toDateString();
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (mesmoDia) return `hoje às ${hora}`;
  if (amanha) return `amanhã às ${hora}`;
  return `${d.toLocaleDateString('pt-BR', { weekday: 'long' })} às ${hora}`;
}

const QuestoesLembretes = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const nativo = Capacitor.isNativePlatform();

  // permissão de notificação
  const [permissao, setPermissao] = useState<'granted' | 'denied' | 'prompt' | 'desconhecida'>('desconhecida');

  // horário
  const [horarioId, setHorarioId] = useState<string | null>(null);
  const [ativo, setAtivo] = useState(true);
  const [dias, setDias] = useState<string[]>(['seg', 'ter', 'qua', 'qui', 'sex']);
  const [horario, setHorario] = useState('20:00');
  const [meta, setMeta] = useState(10);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  // locais
  const [locais, setLocais] = useState<LocalRow[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [localNome, setLocalNome] = useState('Casa');
  const [addressQ, setAddressQ] = useState('');
  const [searching, setSearching] = useState(false);
  const [hits, setHits] = useState<GeocodeResult[]>([]);
  const [selected, setSelected] = useState<GeocodeResult | null>(null);
  const [radius, setRadius] = useState(300);
  const [salvandoLocal, setSalvandoLocal] = useState(false);

  const proximo = useMemo(
    () => (ativo ? formatarProximo(proximoDisparo(dias, horario)) : null),
    [ativo, dias, horario],
  );

  const checarPermissao = useCallback(async () => {
    if (!nativo) {
      if (typeof Notification !== 'undefined') {
        setPermissao(Notification.permission === 'default' ? 'prompt' : (Notification.permission as any));
      }
      return;
    }
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const p = await LocalNotifications.checkPermissions();
      setPermissao(p.display === 'granted' ? 'granted' : p.display === 'denied' ? 'denied' : 'prompt');
    } catch { /* ignore */ }
  }, [nativo]);

  const pedirPermissao = async () => {
    haptic.selection();
    if (!nativo) {
      if (typeof Notification === 'undefined') return;
      const r = await Notification.requestPermission();
      setPermissao(r === 'default' ? 'prompt' : (r as any));
      if (r === 'granted') toast.success('Notificações liberadas!');
      return;
    }
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const r = await LocalNotifications.requestPermissions();
      setPermissao(r.display === 'granted' ? 'granted' : 'denied');
      if (r.display === 'granted') toast.success('Notificações liberadas!');
      else toast.error('Permissão negada. Libere nas configurações do sistema.');
    } catch {
      toast.error('Não foi possível pedir a permissão.');
    }
  };

  const carregar = useCallback(async () => {
    if (!user) return;
    const [{ data: h }, { data: l }] = await Promise.all([
      supabase.from('questoes_lembretes').select('*').eq('user_id', user.id).maybeSingle(),
      supabase
        .from('location_reminders')
        .select('id,label,address,radius_m,active')
        .eq('user_id', user.id)
        .eq('origem', 'questoes')
        .order('created_at', { ascending: false }),
    ]);
    if (h) {
      setHorarioId(h.id);
      setAtivo(h.ativo);
      setDias(h.dias || []);
      setHorario(String(h.horario).substring(0, 5));
      setMeta(h.meta_questoes ?? 10);
    }
    setLocais((l as LocalRow[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => { checarPermissao(); }, [checarPermissao]);

  const agendarLocal = async () => {
    if (!nativo) return;
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') {
        const req = await LocalNotifications.requestPermissions();
        setPermissao(req.display === 'granted' ? 'granted' : 'denied');
        if (req.display !== 'granted') return;
      }
      const pending = await LocalNotifications.getPending();
      const nossas = pending.notifications.filter((n) => String(n.id).startsWith('8888'));
      if (nossas.length) await LocalNotifications.cancel({ notifications: nossas.map((n) => ({ id: n.id })) });
      if (!ativo || !dias.length) return;
      const [hh, mm] = horario.split(':').map(Number);
      for (const dia of dias) {
        const weekday = WEEKDAY_MAP[dia];
        if (!weekday) continue;
        await LocalNotifications.schedule({
          notifications: [{
            id: Number(`8888${weekday}`),
            title: '🎯 Hora de praticar questões',
            body: `Bora resolver ${meta} questões agora?`,
            schedule: { on: { weekday, hour: hh, minute: mm }, allowWhileIdle: true, repeats: true },
            iconColor: '#c94c4c',
            extra: { url: '/questoes/praticar' },
          }],
        });
      }
    } catch (e) {
      console.warn('[questoes-lembretes] agendamento local falhou', e);
    }
  };

  const salvarHorario = async () => {
    if (!user) return;
    if (ativo && dias.length === 0) return toast.error('Escolha pelo menos um dia.');
    setSalvando(true);
    const next = ativo ? proximoDisparo(dias, horario) : null;
    const payload = {
      user_id: user.id,
      ativo,
      dias,
      horario: `${horario}:00`,
      meta_questoes: meta,
      next_fire_at: next ? next.toISOString() : null,
    };
    const { data, error } = horarioId
      ? await supabase.from('questoes_lembretes').update(payload).eq('id', horarioId).select().maybeSingle()
      : await supabase.from('questoes_lembretes').insert(payload).select().maybeSingle();
    setSalvando(false);
    if (error) { toast.error(error.message); return; }
    if (data) setHorarioId(data.id);
    haptic.success?.();
    await agendarLocal();
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2500);
    toast.success(
      ativo && next ? `Pronto! Próximo aviso ${formatarProximo(next)}.` : 'Lembrete atualizado.',
    );
  };

  const testarNotificacao = async () => {
    haptic.selection();
    if (nativo) {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const perm = await LocalNotifications.checkPermissions();
        if (perm.display !== 'granted') return pedirPermissao();
        await LocalNotifications.schedule({
          notifications: [{
            id: 88880,
            title: '🎯 Teste de lembrete',
            body: `Assim você vai ser avisado para resolver ${meta} questões.`,
            schedule: { at: new Date(Date.now() + 5000), allowWhileIdle: true },
            iconColor: '#c94c4c',
            extra: { url: '/questoes/praticar' },
          }],
        });
        toast.success('Teste enviado — chega em 5 segundos.');
      } catch {
        toast.error('Não foi possível enviar o teste.');
      }
      return;
    }
    if (typeof Notification === 'undefined') return toast.error('Este navegador não suporta notificações.');
    if (Notification.permission !== 'granted') return pedirPermissao();
    new Notification('🎯 Teste de lembrete', { body: `Assim você vai ser avisado para resolver ${meta} questões.` });
    toast.success('Teste enviado!');
  };

  const buscar = async () => {
    if (addressQ.trim().length < 3) return;
    setSearching(true);
    const r = await geocodeAddress(addressQ, 5);
    setHits(r);
    setSearching(false);
    if (!r.length) toast.error('Nenhum endereço encontrado.');
  };

  const usarAtual = async () => {
    try {
      const { Geolocation } = await import('@capacitor/geolocation');
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
      setSelected({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        displayName: 'Minha localização atual',
      } as GeocodeResult);
      toast.success('Localização atual selecionada.');
    } catch {
      toast.error('Não conseguimos pegar sua localização.');
    }
  };

  const salvarLocal = async () => {
    if (!user) return;
    if (!selected) return toast.error('Escolha um endereço.');
    setSalvandoLocal(true);
    const { error } = await supabase.from('location_reminders').insert({
      user_id: user.id,
      label: localNome,
      address: selected.displayName,
      lat: selected.lat,
      lng: selected.lng,
      radius_m: radius,
      message: `Você chegou em ${localNome}. Bora praticar questões?`,
      active: true,
      origem: 'questoes',
      target_route: '/questoes/praticar',
    });
    setSalvandoLocal(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Lembrete de chegada criado!');
    setDialogOpen(false);
    setAddressQ(''); setHits([]); setSelected(null); setRadius(300);
    carregar();
    refreshGeofenceReminders(user.id);
    startGeofenceWatcher(user.id);
  };

  const toggleLocal = async (r: LocalRow) => {
    await supabase.from('location_reminders').update({ active: !r.active }).eq('id', r.id);
    carregar();
    if (user) refreshGeofenceReminders(user.id);
  };

  const removerLocal = async (r: LocalRow) => {
    await supabase.from('location_reminders').delete().eq('id', r.id);
    carregar();
    if (user) refreshGeofenceReminders(user.id);
  };

  const resumoDias = dias.length
    ? dias.length === 7
      ? 'todos os dias'
      : DIAS.filter((d) => dias.includes(d.id)).map((d) => d.full).join(', ')
    : 'nenhum dia escolhido';

  return (
    <div className="theme-questoes min-h-dvh bg-background pb-[calc(128px+var(--sai-bottom,0px))]">
      {/* Cabeçalho sem botão de voltar (a navegação é pelo rodapé) */}
      <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-xl">
        <div
          className="mx-auto flex max-w-2xl items-end px-4 pb-3"
          style={{ paddingTop: 'calc(14px + var(--sai-top, 0px))' }}
        >
          <div>
            <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-foreground">Lembretes</h1>
            <p className="text-[13px] text-muted-foreground">Para você nunca deixar de praticar</p>
          </div>
          <span className="ml-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <BellRing className="h-6 w-6" />
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 pt-1">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <>
            {/* Permissão */}
            {permissao !== 'granted' && (
              <button
                type="button"
                onClick={pedirPermissao}
                className="mb-4 flex w-full items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-left"
              >
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
                <span className="min-w-0 flex-1 text-[13.5px] leading-snug text-foreground">
                  {permissao === 'denied'
                    ? 'As notificações estão bloqueadas nas configurações do sistema. Libere para receber os avisos.'
                    : 'Ative as notificações para que o lembrete chegue no seu aparelho.'}
                </span>
                <span className="shrink-0 rounded-full bg-amber-500 px-3 py-1.5 text-[12.5px] font-bold text-black">
                  Ativar
                </span>
              </button>
            )}

            {/* Bloco A — horário */}
            <section className="overflow-hidden rounded-3xl border border-border bg-card">
              <div className="flex items-center gap-3 border-b border-border/70 p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <Clock className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[16px] font-bold leading-snug text-foreground">Lembrete por horário</h2>
                  <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
                    {ativo ? `${resumoDias} · ${horario}` : 'Desativado'}
                  </p>
                </div>
                <Switch checked={ativo} onCheckedChange={(v) => { haptic.selection(); setAtivo(v); }} aria-label="Ativar lembrete por horário" />
              </div>

              <div className={`p-4 transition-opacity ${ativo ? '' : 'pointer-events-none opacity-40'}`}>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => {
                    const on = p.dias.length === dias.length && p.dias.every((d) => dias.includes(d));
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => { haptic.selection(); setDias(p.dias); }}
                        className={`min-h-[38px] rounded-full px-3.5 text-[13px] font-semibold transition-colors ${
                          on ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 grid grid-cols-7 gap-1.5">
                  {DIAS.map((d) => {
                    const on = dias.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => { haptic.selection(); setDias((p) => on ? p.filter((x) => x !== d.id) : [...p, d.id]); }}
                        className={`flex h-12 items-center justify-center rounded-2xl text-[15px] font-bold transition-colors ${
                          on ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}
                        aria-pressed={on}
                        aria-label={d.full}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4">
                  <Label className="text-[13px] text-muted-foreground">Horário do aviso</Label>
                  <Input
                    type="time"
                    value={horario}
                    onChange={(e) => setHorario(e.target.value)}
                    className="mt-1.5 h-14 text-[20px] font-bold"
                  />
                </div>

                <div className="mt-4">
                  <Label className="text-[13px] text-muted-foreground">Meta de questões</Label>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {METAS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => { haptic.selection(); setMeta(m); }}
                        className={`min-h-[44px] min-w-[56px] rounded-2xl px-3 text-[15px] font-bold transition-colors ${
                          meta === m ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                    <Input
                      type="number"
                      min={1}
                      max={200}
                      value={meta}
                      onChange={(e) => setMeta(Math.min(200, Math.max(1, Number(e.target.value) || 1)))}
                      className="h-11 w-[84px] text-center text-[15px]"
                      aria-label="Outra meta"
                    />
                  </div>
                </div>

                {proximo && (
                  <p className="mt-4 rounded-2xl bg-primary/10 px-3.5 py-3 text-[13.5px] font-semibold text-foreground">
                    🔔 Próximo aviso {proximo}
                  </p>
                )}

                <div className="mt-4 flex gap-2.5">
                  <Button className="h-[52px] flex-1 text-[15px] font-bold" onClick={salvarHorario} disabled={salvando}>
                    {salvando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      : salvo ? <Check className="mr-2 h-4 w-4" />
                      : <Bell className="mr-2 h-4 w-4" />}
                    {salvo ? 'Salvo' : 'Salvar lembrete'}
                  </Button>
                  <Button variant="outline" className="h-[52px] shrink-0 px-4 text-[14px] font-semibold" onClick={testarNotificacao}>
                    Testar
                  </Button>
                </div>
              </div>
            </section>

            {/* Bloco B — chegada */}
            <section className="mt-5 overflow-hidden rounded-3xl border border-border bg-card">
              <div className="flex items-center gap-3 border-b border-border/70 p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <MapPin className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[16px] font-bold leading-snug text-foreground">Lembrete por lugar</h2>
                  <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
                    Avisamos quando você chegar no local escolhido.
                  </p>
                </div>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-2 gap-2.5">
                  {LOCAIS.map((l) => {
                    const Icon = l.icon;
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => { haptic.selection(); setLocalNome(l.id); setDialogOpen(true); }}
                        className="flex min-h-[58px] items-center gap-2.5 rounded-2xl border border-border bg-background px-3 py-3 text-left active:scale-[0.99]"
                      >
                        <Icon className="h-5 w-5 shrink-0 text-primary" />
                        <span className="truncate text-[15px] font-semibold text-foreground">{l.id}</span>
                        <Plus className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
                      </button>
                    );
                  })}
                </div>

                {locais.length > 0 && (
                  <ul className="mt-4 space-y-2.5">
                    {locais.map((r) => (
                      <li key={r.id} className="rounded-2xl border border-border bg-background p-3">
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5 shrink-0 text-primary" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[15px] font-semibold text-foreground">{r.label}</p>
                            {r.address && <p className="truncate text-[12px] text-muted-foreground">{r.address}</p>}
                            <p className="text-[12px] text-muted-foreground">Raio {r.radius_m} m</p>
                          </div>
                          <Switch checked={r.active} onCheckedChange={() => toggleLocal(r)} aria-label={`Ativar ${r.label}`} />
                          <button
                            onClick={() => removerLocal(r)}
                            className="flex h-11 w-11 items-center justify-center rounded-full text-destructive"
                            aria-label={`Excluir ${r.label}`}
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            {!nativo && (
              <p className="mt-4 px-1 text-[12.5px] leading-snug text-muted-foreground">
                No app instalado no celular o aviso toca mesmo com o app fechado. No navegador, ele chega como
                notificação enquanto você estiver conectado.
              </p>
            )}
          </>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="theme-questoes max-h-[90dvh] max-w-md overflow-y-auto">
          <DialogHeader><DialogTitle>Chegar em {localNome}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-[13px]">Endereço</Label>
              <div className="mt-1 flex gap-2">
                <Input
                  value={addressQ}
                  onChange={(e) => setAddressQ(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && buscar()}
                  placeholder="Rua, número, cidade"
                  className="h-12 text-[16px]"
                />
                <Button onClick={buscar} disabled={searching} className="h-12 w-12 shrink-0 p-0" aria-label="Buscar endereço">
                  {searching ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                </Button>
              </div>
              <Button variant="outline" className="mt-2 h-12 w-full text-[15px]" onClick={usarAtual}>
                <Navigation2 className="mr-2 h-4 w-4" /> Usar minha localização atual
              </Button>
            </div>

            {hits.length > 0 && (
              <ul className="space-y-2">
                {hits.map((h, i) => (
                  <li key={i}>
                    <button
                      onClick={() => { setSelected(h); setHits([]); setAddressQ(h.displayName); }}
                      className="w-full rounded-xl border border-border bg-background p-3 text-left text-[14px]"
                    >
                      {h.displayName}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {selected && (
              <p className="rounded-xl bg-primary/10 p-3 text-[13px] text-foreground">📍 {selected.displayName}</p>
            )}

            <div>
              <Label className="text-[13px]">Distância do aviso</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {RADII.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRadius(r)}
                    className={`min-h-[44px] rounded-full px-4 text-[14px] font-semibold ${
                      radius === r ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {r} m
                  </button>
                ))}
              </div>
            </div>

            <Button className="h-12 w-full text-[15px] font-bold" onClick={salvarLocal} disabled={salvandoLocal}>
              {salvandoLocal ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Salvar lembrete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <QuestoesBottomNav />
    </div>
  );
};

export default QuestoesLembretes;
