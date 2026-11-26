import type React from 'react';
import { ExternalLink, Filter, Loader2, Scale, Send, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { TargetAudience } from './pushConfig';

interface PushManualFormTabProps {
  targetAudience: TargetAudience;
  onTargetAudienceChange: (val: TargetAudience) => void;
  selectedCategory: string;
  onSelectedCategoryChange: (val: string) => void;
  title: string;
  onTitleChange: (val: string) => void;
  body: string;
  onBodyChange: (val: string) => void;
  destinationUrl: string;
  onDestinationUrlChange: (val: string) => void;
  scheduledTime: string;
  onScheduledTimeChange: (val: string) => void;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function PushManualFormTab({
  targetAudience,
  onTargetAudienceChange,
  selectedCategory,
  onSelectedCategoryChange,
  title,
  onTitleChange,
  body,
  onBodyChange,
  destinationUrl,
  onDestinationUrlChange,
  scheduledTime,
  onScheduledTimeChange,
  submitting,
  onSubmit,
}: PushManualFormTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <Card className="p-5 sm:p-6 rounded-3xl bg-zinc-900/40 border-zinc-800/80">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">Criar Mensagem Manual</h3>
            <p className="text-xs text-zinc-400">Envio pontual com segmentação e isolamento de admin</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-red-500" /> Público Alvo (Segmentação)
            </label>
            <Select value={targetAudience} onValueChange={(v) => onTargetAudienceChange(v as TargetAudience)}>
              <SelectTrigger className="bg-zinc-950 border-zinc-800 text-sm h-10 text-white">
                <SelectValue placeholder="Selecione o público" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                <SelectItem value="users_only">👥 Todos os Usuários Reais (Exclui Admin)</SelectItem>
                <SelectItem value="premium">⭐ Apenas Assinantes VIP (Exclui Admin)</SelectItem>
                <SelectItem value="free">📖 Apenas Usuários Gratuitos (Exclui Admin)</SelectItem>
                <SelectItem value="test_admin">🛡️ Apenas Meu Aparelho Admin (Teste)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300">Categoria do Conteúdo</label>
            <Select value={selectedCategory} onValueChange={onSelectedCategoryChange}>
              <SelectTrigger className="bg-zinc-950 border-zinc-800 text-sm h-10 text-white">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                <SelectItem value="geral">🔔 Notificação Geral</SelectItem>
                <SelectItem value="leis">⚖️ Legislação & Diário Oficial</SelectItem>
                <SelectItem value="noticias">📰 Notícias Jurídicas</SelectItem>
                <SelectItem value="estudos">🎓 Estudo & Questões OAB/Concursos</SelectItem>
                <SelectItem value="lembretes">⏰ Lembrete de Leitura</SelectItem>
                <SelectItem value="blog">✍️ Artigo do Blog</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300">Título do Push</label>
            <Input
              placeholder="Ex: Nova lei publicada hoje no DOU"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="bg-zinc-950 border-zinc-800 text-sm h-10 text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300">Mensagem da Tela de Bloqueio</label>
            <Textarea
              placeholder="Digite o texto que o estudante lerá no celular..."
              className="bg-zinc-950 border-zinc-800 text-sm min-h-[85px] text-white resize-none"
              value={body}
              onChange={(e) => onBodyChange(e.target.value)}
            />
            <div className="text-[11px] text-zinc-500 text-right">{body.length} caracteres</div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5 text-zinc-500" /> Rota ao Tocar (Opcional)
            </label>
            <Input
              placeholder="Ex: /vademecum, /noticias, /blog"
              value={destinationUrl}
              onChange={(e) => onDestinationUrlChange(e.target.value)}
              className="bg-zinc-950 border-zinc-800 text-sm h-10 text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
              <span>Agendar para Mais Tarde (Opcional)</span>
              <span className="text-[10px] text-zinc-500">Vazio = Envio agora</span>
            </label>
            <Input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => onScheduledTimeChange(e.target.value)}
              className="bg-zinc-950 border-zinc-800 text-sm h-10 text-white"
            />
          </div>

          <div className="pt-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-zinc-400 mb-2 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-red-500" /> Prévia do Banner no Aparelho
            </span>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-xl relative overflow-hidden">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center shrink-0 shadow-md">
                  <Scale className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase">DIREITO PRIME</span>
                    <span className="text-[10px] text-zinc-500">agora</span>
                  </div>
                  <p className="text-xs font-bold text-white leading-snug">{title.trim() || 'Título da notificação'}</p>
                  <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">
                    {body.trim() || 'Texto que será exibido no topo do celular do estudante.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-bold text-xs tracking-wider uppercase rounded-xl"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" /> {scheduledTime ? 'Agendar Disparo' : 'Enviar Push Imediato'}
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
