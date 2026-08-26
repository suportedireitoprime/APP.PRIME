import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plus, Trash2, Loader2, Search, Navigation2, Map as MapIcon, Clock, Info, ChevronRight, LocateFixed } from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';
import { PageHeader } from '@/components/vademecum/PageHeader';
import LembretesBottomNav from '@/components/lembretes/LembretesBottomNav';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { toast } from 'sonner';
import { confirmar } from '@/lib/nativo/dialogos';
import { geocodeAddress, type GeocodeResult } from '@/lib/nativeGeocoder';
import { openMap } from '@/lib/nativeMapsLauncher';
import { refreshGeofenceReminders, startGeofenceWatcher } from '@/lib/nativeGeofence';
import { MapaLembrete } from '@/components/mapa/MapaLembrete';

interface LocReminder {
  id: string;
  label: string;
  address: string | null;
  lat: number;
  lng: number;
  radius_m: number;
  message: string;
  active: boolean;
  triggered_count: number;
  last_triggered_at: string | null;
}

const RADII = [100, 300, 500, 1000, 2000];

export default function LembretesLocal() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<LocReminder[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [mapaAberto, setMapaAberto] = useState<LocReminder | null>(null);
  const navigate = useNavigate();

  // form state
  const [label, setLabel] = useState('');
  const [message, setMessage] = useState('');
  const [addressQ, setAddressQ] = useState('');
  const [searching, setSearching] = useState(false);
  const [hits, setHits] = useState<GeocodeResult[]>([]);
  const [selected, setSelected] = useState<GeocodeResult | null>(null);
  const [radius, setRadius] = useState(300);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('location_reminders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setRows((data as any) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const doSearch = async () => {
    if (!addressQ.trim()) return;
    setSearching(true);
    setHits([]);
    try {
      const res = await geocodeAddress(addressQ);
      setHits(res);
      if (res.length === 0) toast('Nenhum endereço encontrado.');
    } catch (e) {
      toast.error('Erro ao buscar endereço.');
    }
    setSearching(false);
  };

  const useMyLocation = async () => {
    setSearching(true);
    try {
      const pos = await Geolocation.getCurrentPosition();
      setSelected({
        displayName: 'Minha Localização',
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
      setAddressQ('Minha Localização');
    } catch (err) {
      toast.error('Não foi possível obter a localização atual.');
    } finally {
      setSearching(false);
    }
  };

  const resetForm = () => {
    setLabel(''); setMessage(''); setAddressQ(''); setHits([]); setSelected(null); setRadius(300);
  };

  const save = async () => {
    if (!user) return;
    if (!label.trim()) return toast.error('Dê um nome ao lembrete.');
    if (!selected) return toast.error('Escolha um endereço.');
    if (!message.trim()) return toast.error('Escreva a mensagem do lembrete.');
    setSaving(true);
    const { error } = await supabase.from('location_reminders').insert({
      user_id: user.id,
      label: label.trim(),
      address: selected.displayName,
      lat: selected.lat,
      lng: selected.lng,
      radius_m: radius,
      message: message.trim(),
      active: true,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Lembrete criado!');
    setDialogOpen(false);
    resetForm();
    load();
    refreshGeofenceReminders(user.id);
    startGeofenceWatcher(user.id);
  };

  const toggleActive = async (r: LocReminder) => {
    await supabase.from('location_reminders').update({ active: !r.active }).eq('id', r.id);
    load();
    if (user) refreshGeofenceReminders(user.id);
  };

  const remove = async (r: LocReminder) => {
    if (!(await confirmar({ mensagem: `Excluir "${r.label}"?` }))) return;
    await supabase.from('location_reminders').delete().eq('id', r.id);
    load();
    if (user) refreshGeofenceReminders(user.id);
  };

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader title="Lembretes" subtitle="Locais" onBack={() => navigate(-1)} />
      <div className="mx-auto max-w-2xl p-4 pb-[calc(110px+var(--sai-bottom,0px))] lg:max-w-[1200px] lg:px-12 lg:py-8">
        <p className="mb-4 text-sm text-muted-foreground">
          Receba uma notificação quando chegar perto de um lugar — faculdade, fórum, cartório, sala da OAB.
          No app instalado, o aviso chega mesmo com o app fechado.
        </p>

        <Button className="w-full mb-6 lg:w-auto lg:px-8" onClick={() => setDrawerOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Novo lembrete
        </Button>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MapPin className="mx-auto mb-3 h-10 w-10 opacity-40" />
            Nenhum lembrete por local ainda.
          </div>
        ) : (
          <ul className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0 2xl:grid-cols-3">
            {rows.map((r) => (
              <li key={r.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary shrink-0" />
                      <h3 className="font-semibold truncate">{r.label}</h3>
                    </div>
                    {r.address && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{r.address}</p>}
                    <p className="mt-2 text-sm">{r.message}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Raio {r.radius_m} m · disparado {r.triggered_count}x
                    </p>
                  </div>
                  <Switch checked={r.active} onCheckedChange={() => toggleActive(r)} />
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => setMapaAberto(r)}>
                    <MapIcon className="mr-1 h-3.5 w-3.5" /> Mapa vivo
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openMap({ lat: r.lat, lng: r.lng, label: r.label })}>
                    <Navigation2 className="mr-1 h-3.5 w-3.5" /> Rota
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(r)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-md max-h-[90dvh] overflow-y-auto sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold tracking-normal text-foreground">
              Novo lembrete por local
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div>
              <Label className="text-muted-foreground mb-1 block">Nome do Lembrete</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex: Faculdade, Fórum, OAB..." className="bg-muted/30" />
            </div>
            
            <div className="rounded-xl border border-border p-4 bg-muted/10 space-y-4">
              <div>
                <Label className="text-muted-foreground mb-1 block">Endereço ou Local</Label>
                <div className="flex gap-2">
                  <Input
                    value={addressQ}
                    onChange={(e) => setAddressQ(e.target.value)}
                    placeholder="Digite o endereço..."
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); doSearch(); } }}
                  />
                  <Button type="button" size="icon" variant="secondary" onClick={doSearch} disabled={searching}>
                    {searching && !addressQ.includes('Minha') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
                
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2 text-primary hover:bg-primary/10 h-8 px-2"
                  onClick={useMyLocation}
                  disabled={searching}
                >
                  <LocateFixed className="w-3.5 h-3.5 mr-1.5" />
                  Usar minha localização
                </Button>
              </div>
              
              {hits.length > 0 && (
                <ul className="max-h-40 overflow-y-auto rounded-lg border border-border divide-y divide-border bg-background shadow-sm">
                  {hits.map((h, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => { setSelected(h); setHits([]); setAddressQ(h.displayName); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                      >
                        {h.displayName}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {selected && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-primary" />
                    {selected.lat.toFixed(4)}, {selected.lng.toFixed(4)}
                  </p>
                  <MapaLembrete
                    className="rounded-xl overflow-hidden border border-border"
                    destino={{ lat: selected.lat, lng: selected.lng }}
                    label={label || selected.displayName}
                    raioM={radius}
                  />
                </div>
              )}
            </div>

            <div>
              <Label className="text-muted-foreground mb-1 block">Área de disparo (Raio em metros)</Label>
              <div className="flex flex-wrap gap-2">
                {RADII.map((r) => (
                  <Button
                    key={r}
                    type="button"
                    size="sm"
                    className="rounded-full"
                    variant={radius === r ? 'default' : 'outline'}
                    onClick={() => setRadius(r)}
                  >
                    {r >= 1000 ? `${r / 1000} km` : `${r} m`}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground mb-1 block">Mensagem da Notificação</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ex: Revisar apostila de constitucional..."
                rows={3}
                className="bg-muted/30 resize-none"
              />
            </div>
            
            <Button className="w-full mt-2 rounded-xl h-11 text-base font-semibold" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              Salvar Lembrete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!mapaAberto} onOpenChange={(o) => { if (!o) setMapaAberto(null); }}>
        <DialogContent className="max-w-md max-h-[92dvh] overflow-y-auto">
          <DialogHeader><DialogTitle>{mapaAberto?.label}</DialogTitle></DialogHeader>
          {mapaAberto && (
            <div className="space-y-3">
              {mapaAberto.address && (
                <p className="text-xs text-muted-foreground">{mapaAberto.address}</p>
              )}
              <MapaLembrete
                destino={{ lat: mapaAberto.lat, lng: mapaAberto.lng }}
                label={mapaAberto.label}
                raioM={mapaAberto.radius_m}
              />
              <p className="rounded-xl bg-muted/50 p-3 text-sm">{mapaAberto.message}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm px-4 pb-8 pt-4">
            <DrawerHeader className="px-0 text-left">
              <DrawerTitle className="text-xl font-bold font-display tracking-tight text-foreground">
                Criar Novo Lembrete
              </DrawerTitle>
            </DrawerHeader>

            <div className="mt-4 flex flex-col gap-3">
              {/* Lembrete por Horário */}
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  toast('Lembrete por horário em breve!');
                }}
                className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:bg-muted active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Por Horário</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Defina uma hora e dia específico.</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>

              {/* Lembrete por Local */}
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  setTimeout(() => setDialogOpen(true), 150);
                }}
                className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-primary/20 bg-primary/[0.03] p-4 text-left shadow-sm transition-all hover:bg-primary/5 active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-foreground">Por Local</h3>
                      <div 
                        onClick={(e) => { e.stopPropagation(); setInfoOpen(true); }}
                        className="p-1 rounded-full text-muted-foreground hover:bg-foreground/5 hover:text-foreground transition-colors cursor-pointer"
                      >
                        <Info className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Seja avisado ao chegar em um endereço.</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <MapPin className="h-7 w-7 text-primary" />
          </div>
          <h2 className="mb-2 font-display text-lg font-bold text-foreground">Monitoramento Invisível</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Usamos a tecnologia nativa do seu celular. O aplicativo <strong>não precisa estar aberto</strong> e não deixamos notificações chatas presas na sua tela. Quando você passar pelo local, a mágica acontece.
          </p>
          <Button className="mt-6 w-full rounded-full" onClick={() => setInfoOpen(false)}>Entendi!</Button>
        </DialogContent>
      </Dialog>

      <LembretesBottomNav />
    </div>
  );
}
