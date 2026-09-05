import React from 'react';
import { Loader2, Crown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { TabsContent } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import horusOwlBundled from '@/assets/horus/horus-owl.webp';
import horusOwlAsset from '@/assets/horus/horus-owl.png.asset.json';
import { pickAsset, srcOf } from '@/lib/assetUrl';

const horusOwl = pickAsset(horusOwlBundled, srcOf(horusOwlAsset));

interface ArtigoTabExemploProps {
  isPremium: boolean;
  openPremiumGate: (feature: any) => void;
  aiLoading: boolean;
  aiContent?: string;
  fontSize: number;
  splitSections: (text: string, marker: string) => Array<{ title: string; body: string }>;
}

export const ArtigoTabExemplo: React.FC<ArtigoTabExemploProps> = ({
  isPremium,
  openPremiumGate,
  aiLoading,
  aiContent,
  fontSize,
  splitSections,
}) => {
  return (
    <TabsContent value="exemplo" className="px-5 pb-[calc(8rem+var(--sai-bottom,0px))] pt-4">
      {!isPremium ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-amber-500/20 to-primary/20 p-2 border border-amber-500/30 flex items-center justify-center mb-3 shadow-lg shadow-primary/20">
            <img src={horusOwl} alt="Horus" className="w-12 h-12 object-contain" />
          </div>
          <h4 className="font-display text-lg font-bold text-foreground mb-1.5">
            Exemplos Práticos são Exclusivos Prime
          </h4>
          <p className="text-xs text-muted-foreground max-w-xs mb-4 leading-relaxed">
            Veja a norma aplicada em casos concretos do dia a dia e situações reais cobradas nas
            provas da OAB e concursos públicos.
          </p>
          <button
            onClick={() => openPremiumGate('exemplo')}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-lg shadow-primary/30 active:scale-95 transition-all flex items-center gap-2"
          >
            <Crown className="w-4 h-4 fill-current" /> Começar 3 dias grátis
          </button>
        </div>
      ) : aiLoading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-body">
            Gerando exemplos práticos com IA...
          </p>
        </div>
      ) : aiContent ? (
        (() => {
          const sections = splitSections(aiContent, '---EXEMPLO---');
          if (sections.length <= 1) {
            return (
              <div
                className="prose prose-sm dark:prose-invert max-w-none font-body leading-relaxed [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 [&_h2]:font-bold [&_h2]:text-foreground [&_h3]:font-bold [&_strong]:text-foreground"
                style={{ fontSize: `${fontSize}px` }}
              >
                <ReactMarkdown>{aiContent}</ReactMarkdown>
              </div>
            );
          }
          return (
            <Accordion type="single" collapsible className="space-y-2">
              {sections.map((sec, i) => {
                const borderColors = [
                  'border-l-emerald-500/70',
                  'border-l-sky-500/70',
                  'border-l-amber-500/70',
                  'border-l-violet-500/70',
                ];
                const strongColors = [
                  '[&_strong]:text-emerald-400',
                  '[&_strong]:text-sky-400',
                  '[&_strong]:text-amber-400',
                  '[&_strong]:text-violet-400',
                ];
                return (
                  <AccordionItem
                    key={i}
                    value={`ex-${i}`}
                    className={`border border-border rounded-xl overflow-hidden bg-secondary/30 border-l-4 ${
                      borderColors[i % borderColors.length]
                    }`}
                  >
                    <AccordionTrigger className="px-4 py-4 text-base font-semibold text-foreground text-left hover:no-underline [&[data-state=open]>svg]:rotate-180">
                      {sec.title}
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div
                        className={`prose prose-sm dark:prose-invert max-w-none font-body leading-relaxed [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 ${
                          strongColors[i % strongColors.length]
                        }`}
                        style={{ fontSize: `${fontSize}px` }}
                      >
                        <ReactMarkdown>{sec.body}</ReactMarkdown>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          );
        })()
      ) : (
        <p className="text-muted-foreground text-sm text-center py-8">Clique para gerar exemplos.</p>
      )}
    </TabsContent>
  );
};
