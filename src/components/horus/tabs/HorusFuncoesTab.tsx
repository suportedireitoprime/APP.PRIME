import { motion } from 'framer-motion';
import { Send, Mic, FileText, Image as ImageIcon, Gavel, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import HorusSectionHero from '@/components/horus/HorusSectionHero';
import { HorusTopTabs, HorusTab } from './HorusTopTabs';
import { Sparkles } from 'lucide-react';

export const HORUS_COLOR: Record<string, { bg: string; text: string }> = {
  emerald: { bg: 'bg-emerald-500/20 ring-1 ring-emerald-400/40', text: 'text-emerald-400' },
  sky: { bg: 'bg-sky-500/20 ring-1 ring-sky-400/40', text: 'text-sky-400' },
  rose: { bg: 'bg-rose-500/20 ring-1 ring-rose-400/40', text: 'text-rose-400' },
  violet: { bg: 'bg-violet-500/20 ring-1 ring-violet-400/40', text: 'text-violet-400' },
  amber: { bg: 'bg-amber-500/20 ring-1 ring-amber-400/40', text: 'text-amber-400' },
  cyan: { bg: 'bg-cyan-500/20 ring-1 ring-cyan-400/40', text: 'text-cyan-400' },
};

const funcoesList = [
  { icon: Send, color: 'emerald', label: 'Enviar mensagem', desc: 'Mande qualquer dúvida por texto no WhatsApp e receba resposta na hora.' },
  { icon: Mic, color: 'sky', label: 'Áudio por voz', desc: 'Grave um áudio explicando sua dúvida. O Horus entende e responde em áudio também.' },
  { icon: FileText, color: 'rose', label: 'Ler PDF', desc: 'Envie um PDF de prova, artigo ou trabalho e peça resumo, correção ou explicação.' },
  { icon: ImageIcon, color: 'violet', label: 'Ler imagem', desc: 'Envie foto do caderno, prova ou documento — ele lê e comenta.' },
  { icon: Gavel, color: 'amber', label: 'Dúvidas jurídicas', desc: 'Explica artigos, súmulas, jurisprudência e conceitos de forma simples.' },
  { icon: BookOpen, color: 'cyan', label: 'Explicar lição', desc: 'Peça explicação passo a passo de qualquer conteúdo que estiver estudando.' },
];

export function HorusFuncoesTab({ tab, setTab }: { tab: HorusTab; setTab: (t: HorusTab) => void }) {
  return (
    <motion.div
      key="funcoes"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      className="flex flex-col gap-2.5"
    >
      <HorusTopTabs active={tab} onChange={setTab} />
      <div className="px-4 pt-2" />
      <HorusSectionHero
        icon={Gavel}
        eyebrow="O que o Horus faz"
        title="Funções do assistente"
        description="Tudo o que você pode pedir ao Horus no WhatsApp — texto, áudio, PDF, imagem e dúvidas jurídicas."
      />

      {funcoesList.map((f, i) => {
        const Icon = f.icon;
        return (
          <motion.div
            key={f.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-start gap-3 p-4 rounded-2xl bg-secondary/50 border border-border"
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${HORUS_COLOR[f.color].bg}`}>
              <Icon className={`w-5 h-5 ${HORUS_COLOR[f.color].text}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body text-base font-bold leading-tight">{f.label}</p>
              <p className="font-body text-sm text-muted-foreground leading-snug mt-1">{f.desc}</p>
            </div>
          </motion.div>
        );
      })}

      <div className="px-4 pt-4">
        <div className="p-5 rounded-2xl bg-secondary/50 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="font-display text-lg font-bold">Sobre</h3>
          </div>
          <div className="font-body text-sm text-foreground/90 leading-relaxed prose prose-invert prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {`O **Horus** é o assistente jurídico do Direito Prime. Ele nasceu para tirar o peso da burocracia do Direito e deixar o estudo mais leve, direto e produtivo.

## Para que serve?

Imagine ter um colega de Direito disponível **24 horas por dia**, que não se cansa, não julga e explica qualquer tema jurídico como se você estivesse conversando com um amigo. É isso que o Horus faz:

- **Tira dúvidas** sobre artigos, súmulas, jurisprudência e conceitos jurídicos.
- **Lê PDFs** de provas, artigos, trabalhos e petições para resumir ou explicar pontos importantes.
- **Entende imagens** de documentos, cadernos, provas e fotos de tela.
- **Responde áudio** para você poder estudar enquanto dirige, caminha ou descansa.
- **Envia alertas** sobre novas leis, boletins jurídicos e mudanças em artigos favoritados.

## Como ele funciona?

O Horus usa inteligência artificial para interpretar sua pergunta, consultar bases jurídicas e montar uma resposta didática. Ele não substitui um advogado, mas é um **acelerador de estudo** e um **primeiro socorro** para dúvidas do dia a dia.

## Quem pode usar?

Qualquer pessoa que tenha uma conta no Direito Prime. Algumas funções são gratuitas e outras fazem parte do Direito Prime Premium, desbloqueando acesso ilimitado a PDFs, imagens e áudios.

> **Dica:** quanto mais específica for a sua pergunta, melhor será a resposta. Tente incluir o artigo, a lei ou o contexto que você está estudando.`}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
