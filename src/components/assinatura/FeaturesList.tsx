import { motion } from "framer-motion";
import { Scale, MessageCircle, Brain, Library, Headphones, FileText, Sparkles, Monitor, Shield, Briefcase, Zap } from "lucide-react";

export const PRO_FEATURES = [
  { icon: Scale, text: 'Vade Mecum completo todas as leis em vigor, sempre atualizadas' },
  { icon: MessageCircle, text: 'Horus 24h no WhatsApp assistente jurídico com todas as funções' },
  { icon: Brain, text: 'IA jurídica ilimitada tire dúvidas, gere peças e estude sem parar' },
  { icon: Library, text: 'Biblioteca profissional com +200 livros e ebooks jurídicos' },
  { icon: Headphones, text: 'Narração nativa ouça leis inteiras com voz humana' },
  { icon: FileText, text: 'Resumos automáticos por IA de leis, artigos e livros' },
  { icon: Sparkles, text: 'Funções do artigo explicar, mapa mental, flashcards e mais' },
  { icon: Monitor, text: 'Acesso completo no Desktop, Web e App sincronizados' },
  { icon: Shield, text: 'Radar Legislativo em tempo real nenhuma novidade escapa' },
  { icon: Briefcase, text: 'Uso profissional liberado advogados, servidores e concurseiros' },
  { icon: Zap, text: 'Sem anúncios Suporte prioritário Atualizações antecipadas' },
];

export function FeaturesList({ tabKey }: { tabKey: string }) {
  return (
    <motion.div
      key={tabKey}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-4 rounded-2xl p-5 bg-card/60 border border-border"
    >
      <div className="flex items-center gap-2 mb-4">
        <h3 className="font-display text-sm font-bold text-foreground uppercase tracking-wider">
          Tudo que você desbloqueia
        </h3>
      </div>
      <ul className="space-y-3">
        {PRO_FEATURES.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0 w-6 h-6 rounded-lg bg-muted flex items-center justify-center">
              <Icon className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
            </div>
            <span className="font-body text-sm text-foreground leading-snug">{text}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
