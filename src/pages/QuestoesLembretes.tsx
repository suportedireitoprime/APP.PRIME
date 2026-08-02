import { useCallback, useEffect, useState } from 'react';
import { Bell, Clock, MapPin, Loader2, Search, Navigation2, Trash2, Home, GraduationCap, Briefcase, Building2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { AppHeader } from '@/components/layout/AppHeader';
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
  { id: 'seg', label: 'S' },
  { id: 'ter', label: 'T' },
  { id: 'qua', label: 'Q' },
  { id: 'qui', label: 'Q' },
  { id: 'sex', label: 'S' },
  { id: 'sab', label: 'S' },
  { id: 'dom', label: 'D' },
];

const WEEKDAY_MAP: Record<string, number> = { dom: 1, seg: 2, ter: 3, qua: 4, qui: 5, sex: 6, sab: 7 };

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

const QuestoesLembretes = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // horário
  const [horarioId, setHorarioId] = useState<string | null>(null);
  const [ativo, setAtivo] = useState(true);
  const [dias, setDias] = useState<string[]>(['seg', 'ter', 'qua', 'qui', 'sex']);
  const [horario, setHorario] = useState('20:00');
  const [meta, setMeta] = useState(10);
  const [salvando, setSalvando] = useState(false);

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

  const agendarLocal = async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
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
    const payload = {
      user_id: user.id,
      ativo,
      dias,
      horario: `${horario}:00`,
      meta_questoes: meta,
      next_fire_at: null,
    };
    const { data, error } = horarioId
      ? await supabase.from('questoes_lembretes').update(payload).eq('id', horarioId).select().maybeSingle()
      : await supabase.from('questoes_lembretes').insert(payload).select().maybeSingle();
    setSalvando(false);
    if (error) { toast.error(error.message); return; }
    if (data) setHorarioId(data.id);
    haptic.success?.();
    await agendarLocal();
    toast.success('Lembrete por horário salvo!');
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

  return (
    <div className="theme-questoes min-h-dvh bg-background pb-[calc(128px+var(--sai-bottom,0px))]">
      <AppHeader title="Lembretes de questões" />

      <div className="mx-auto max-w-2xl px-4 pt-4">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <>
            {/* Bloco A — horário */}
            <section className="rounded-3xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <Clock className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[17px] font-bold leading-snug text-foreground">
                    Quero ser lembrado de praticar questões no horário
                  </h2>
                  <p className="mt-1 text-[14px] text-muted-foreground">Escolha os dias e a hora do aviso.</p>
                </div>
                <Switch checked={ativo} onCheckedChange={setAtivo} aria-label="Ativar lembrete por horário" />
              </div>

              <div className="mt-4 flex justify-between gap-1.5">
                {DIAS.map((d) => {
                  const on = dias.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => { haptic.selection(); setDias((p) => on ? p.filter((x) => x !== d.id) : [...p, d.id]); }}
                      className={`h-11 w-11 rounded-full text-[15px] font-bold transition-colors ${
                        on ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}
                      aria-pressed={on}
                      aria-label={d.id}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[13px]">Horário</Label>
                  <Input
                    type="time"
                    value={horario}
                    onChange={(e) => setHorario(e.target.value)}
                    className="mt-1 h-12 text-[16px]"
                  />
                </div>
                <div>
                  <Label className="text-[13px]">Questões</Label>
                  <Input
                    type="number"
                    min={1}
                    max={200}
                    value={meta}
                    onChange={(e) => setMeta(Math.max(1, Number(e.target.value) || 1))}
                    className="mt-1 h-12 text-[16px]"
                  />
                </div>
              </div>

              <Button className="mt-4 h-12 w-full text-[15px] font-bold" onClick={salvarHorario} disabled={salvando}>
                {salvando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bell className="mr-2 h-4 w-4" />}
                Salvar lembrete
              </Button>
            </section>

            {/* Bloco B — chegada */}
            <section className="mt-5 rounded-3xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <MapPin className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[17px] font-bold leading-snug text-foreground">
                    Quero ser lembrado de praticar questões quando eu chegar em:
                  </h2>
                  <p className="mt-1 text-[14px] text-muted-foreground">Escolha o lugar e o endereço.</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5">
                {LOCAIS.map((l) => {
                  const Icon = l.icon;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => { haptic.selection(); setLocalNome(l.id); setDialogOpen(true); }}
                      className="flex min-h-[56px] items-center gap-2.5 rounded-2xl border border-border bg-background px-3 py-3 text-left active:scale-[0.99]"
                    >
                      <Icon className="h-5 w-5 text-primary" />
                      <span className="text-[15px] font-semibold text-foreground">{l.id}</span>
                      <Plus className="ml-auto h-4 w-4 text-muted-foreground" />
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
            </section>
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
