import { useState } from 'react';
import { Loader2, Navigation2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { geocodeAddress, type GeocodeResult } from '@/lib/nativeGeocoder';
import { refreshGeofenceReminders, startGeofenceWatcher } from '@/lib/nativeGeofence';
import { RADII } from '@/lib/questoesLembretesUtils';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  localNome: string;
  userId?: string;
  onSaved: () => void;
};

export default function LembreteLocalDialog({ open, onOpenChange, localNome, userId, onSaved }: Props) {
  const [addressQ, setAddressQ] = useState('');
  const [searching, setSearching] = useState(false);
  const [hits, setHits] = useState<GeocodeResult[]>([]);
  const [selected, setSelected] = useState<GeocodeResult | null>(null);
  const [radius, setRadius] = useState(300);
  const [salvandoLocal, setSalvandoLocal] = useState(false);

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
    if (!userId) return;
    if (!selected) return toast.error('Escolha um endereço.');
    setSalvandoLocal(true);
    const { error } = await supabase.from('location_reminders').insert({
      user_id: userId,
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
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Lembrete de chegada criado!');
    onOpenChange(false);
    setAddressQ('');
    setHits([]);
    setSelected(null);
    setRadius(300);
    onSaved();
    refreshGeofenceReminders(userId);
    startGeofenceWatcher(userId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
  );
}
