import { Moon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { haptic } from '@/lib/nativeHaptics';
import type { RegraNotificacaoLocal } from '@/lib/nativo/notificacaoLocalManager';

type Props = {
  regraSelecionada: RegraNotificacaoLocal;
  onAtualizarRegra: (id: string, patch: Partial<RegraNotificacaoLocal>) => void;
};

const OPCOES_HORAS = [
  { horas: 0.5, label: '30 min' },
  { horas: 1, label: '1 hora' },
  { horas: 2, label: '2h (Padrão)' },
  { horas: 4, label: '4 horas' },
  { horas: 12, label: '12 horas' },
  { horas: 24, label: '24 horas' },
];

export default function NotificacoesGatilhosTab({ regraSelecionada, onAtualizarRegra }: Props) {
  return (
    <div className="space-y-3 pt-1">
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-white/5">
        <span className="text-xs text-zinc-300">Ativar disparo automático</span>
        <Switch
          checked={regraSelecionada.ativo}
          onCheckedChange={(checked) => {
            haptic.selection();
            onAtualizarRegra(regraSelecionada.id, { ativo: checked });
          }}
        />
      </div>

      <div className="space-y-1.5">
        <span className="text-[11px] text-zinc-400">Tempo após pausar:</span>
        <div className="grid grid-cols-3 gap-1.5">
          {OPCOES_HORAS.map((opt) => {
            const ativo = (regraSelecionada.gatilhoHorasInatividade || 2) === opt.horas;
            return (
              <button
                key={opt.horas}
                type="button"
                onClick={() => {
                  haptic.selection();
                  onAtualizarRegra(regraSelecionada.id, { gatilhoHorasInatividade: opt.horas });
                }}
                className={`py-1.5 rounded-lg text-xs font-medium transition-all ${
                  ativo
                    ? 'bg-white text-zinc-950 font-semibold'
                    : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-white/5'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-white/5 mt-2">
        <div className="flex items-center gap-2">
          <Moon className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs text-zinc-300">Silêncio Noturno (23h às 07h)</span>
        </div>
        <Switch
          checked={regraSelecionada.quietHoursAtivo ?? true}
          onCheckedChange={(checked) => {
            haptic.selection();
            onAtualizarRegra(regraSelecionada.id, { quietHoursAtivo: checked });
          }}
        />
      </div>
    </div>
  );
}
