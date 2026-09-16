import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  { icon: Zap, text: 'Sem anúncios, Suporte prioritário, Atualizações antecipadas' },
];

const ITEMS_PER_PAGE = 5;
const TOTAL_PAGES = Math.ceil(PRO_FEATURES.length / ITEMS_PER_PAGE);

export function FeaturesList({ tabKey }: { tabKey: string }) {
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % TOTAL_PAGES);
    }, 4500);
    return () => clearInterval(timer);
  }, [tabKey]); // reset interval if tabKey changes (though it shouldn't matter much)

  const currentFeatures = PRO_FEATURES.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  return (
    <motion.div
      key={tabKey}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-4 rounded-2xl p-5 bg-card/60 border border-border overflow-hidden"
    >
      <div className="flex items-center justify-between gap-2 mb-4">
        <h3 className="font-display text-sm font-bold text-foreground uppercase tracking-wider">
          Tudo que você desbloqueia
        </h3>
        
        {/* Pagination Dots */}
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_PAGES }).map((_, idx) => (
            <div 
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentPage === idx ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="relative" style={{ minHeight: '220px' }}>
        <AnimatePresence mode="wait">
          <motion.ul
            key={currentPage}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="space-y-3 absolute inset-0 w-full"
          >
            {currentFeatures.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0 w-6 h-6 rounded-lg bg-muted flex items-center justify-center">
                  <Icon className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
                </div>
                <span className="font-body text-sm text-foreground leading-snug">{text}</span>
              </li>
            ))}
          </motion.ul>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
