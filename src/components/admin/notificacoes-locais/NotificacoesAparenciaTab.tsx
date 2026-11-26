import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { haptic } from '@/lib/nativeHaptics';
import type { RegraNotificacaoLocal } from '@/lib/nativo/notificacaoLocalManager';

type Props = {
  regraSelecionada: RegraNotificacaoLocal;
  onAtualizarRegra: (id: string, patch: Partial<RegraNotificacaoLocal>) => void;
};

export function NotificacoesAparenciaTab({ regraSelecionada, onAtualizarRegra }: Props) {
  return (
    <div className="space-y-3 pt-1">
      <div className="space-y-1">
        <span className="text-[11px] text-zinc-400">Título da Notificação</span>
        <Input
          value={regraSelecionada.exemploTitulo}
          onChange={(e) => onAtualizarRegra(regraSelecionada.id, { exemploTitulo: e.target.value })}
          className="bg-zinc-900/90 border-white/10 text-xs text-white h-9 rounded-xl"
        />
      </div>

      <div className="space-y-1">
        <span className="text-[11px] text-zinc-400">Subtítulo</span>
        <Input
          value={regraSelecionada.exemploSubtitulo}
          onChange={(e) => onAtualizarRegra(regraSelecionada.id, { exemploSubtitulo: e.target.value })}
          className="bg-zinc-900/90 border-white/10 text-xs text-white h-9 rounded-xl"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <span className="text-[11px] text-zinc-400">Botão de Ação</span>
          <Input
            value={regraSelecionada.textoBotaoAcao}
            onChange={(e) => onAtualizarRegra(regraSelecionada.id, { textoBotaoAcao: e.target.value })}
            className="bg-zinc-900/90 border-white/10 text-xs text-white h-9 rounded-xl"
          />
        </div>

        <div className="space-y-1">
          <span className="text-[11px] text-zinc-400">Rota</span>
          <Input
            value={regraSelecionada.rotaPadrao}
            onChange={(e) => onAtualizarRegra(regraSelecionada.id, { rotaPadrao: e.target.value })}
            className="bg-zinc-900/90 border-white/10 text-xs text-white h-9 rounded-xl font-mono"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-zinc-400">Barra de progresso azul</span>
        <Switch
          checked={regraSelecionada.mostrarBarraProgresso}
          onCheckedChange={(checked) => {
            haptic.selection();
            onAtualizarRegra(regraSelecionada.id, { mostrarBarraProgresso: checked });
          }}
        />
      </div>
    </div>
  );
}
