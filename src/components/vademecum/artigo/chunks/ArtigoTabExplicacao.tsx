import React from 'react';
import { ExternalLink, Loader2, Crown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { TabsContent } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import horusOwlBundled from '@/assets/horus/horus-owl.webp';
import horusOwlAsset from '@/assets/horus/horus-owl.png.asset.json';
import { pickAsset, srcOf } from '@/lib/assetUrl';
import { type ModificationInfo } from '../artigoConstants';
import type { ArtigoLei } from '@/data/mockData';

const horusOwl = pickAsset(horusOwlBundled, srcOf(horusOwlAsset));

interface ArtigoTabExplicacaoProps {
  artigo: ArtigoLei;
  modificationInfo?: ModificationInfo;
  isPremium: boolean;
  openPremiumGate: (feature: any) => void;
  aiLoading: boolean;
  aiContent?: string;
  fontSize: number;
  splitSections: (text: string, marker: string) => Array<{ title: string; body: string }>;
}

export const ArtigoTabExplicacao: React.FC<ArtigoTabExplicacaoProps> = ({
  artigo,
  modificationInfo,
  isPremium,
  openPremiumGate,
  aiLoading,
  aiContent,
  fontSize,
  splitSections,
}) => {
  return (
    <TabsContent value="explicacao" className="px-5 pb-[calc(8rem+var(--sai-bottom,0px))] pt-4">
      {modificationInfo ? (
        <div className="space-y-5">
          <div className="rounded-2xl bg-violet-500/10 border border-violet-500/20 p-4">
            <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-2">
              O que mudou
            </h4>
            <p className="text-sm text-foreground/90 leading-relaxed">
              {(() => {
                const parte = modificationInfo.parteModificada;
                const tipo = modificationInfo.tipo.toLowerCase();
                const lei = modificationInfo.leiNome;
                if (/incluíd|acrescid/i.test(modificationInfo.tipo)) {
                  return parte === 'Artigo inteiro'
                    ? `O ${artigo.numero} foi inteiramente incluído no ordenamento jurídico pela ${lei}.`
                    : `O ${parte} do ${artigo.numero} foi incluído pela ${lei}. Na aba "Artigo", ele está destacado em roxo.`;
                }
                if (/alterad|redaç/i.test(modificationInfo.tipo)) {
                  return parte === 'Artigo inteiro'
                    ? `Todo o ${artigo.numero} teve sua redação alterada pela ${lei}.`
                    : `O ${parte} do ${artigo.numero} teve sua redação modificada pela ${lei}. Na aba "Artigo", o trecho está destacado em roxo.`;
                }
                if (/revogad/i.test(modificationInfo.tipo)) {
                  return `Este dispositivo foi revogado pela ${lei} e não produz mais efeitos jurídicos.`;
                }
                return `O ${parte} do ${artigo.numero} foi ${tipo} pela ${lei}.`;
              })()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-400">
              {modificationInfo.tipo}
            </span>
            <span className="text-xs text-foreground/60 font-medium">
              {modificationInfo.parteModificada}
            </span>
          </div>
          <div className="rounded-2xl bg-card border border-border p-4">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Lei modificadora
            </h4>
            <p className="text-sm font-semibold text-foreground mb-1">
              {modificationInfo.leiNome}
            </p>
            <p className="text-xs text-muted-foreground italic mb-3">
              {modificationInfo.referencia}
            </p>
            {(() => {
              const leiMatch = modificationInfo.leiNome.match(
                /(?:Lei(?:\s+Complementar)?|Decreto(?:-Lei)?|Emenda\s+Constitucional)\s+n[ºº]?\s*([\d.]+)/i
              );
              if (leiMatch) {
                const num = leiMatch[1].replace(/\./g, '');
                const isLC = /complementar/i.test(modificationInfo.leiNome);
                const searchUrl = isLC
                  ? `https://www.planalto.gov.br/ccivil_03/leis/lcp/Lcp${num}.htm`
                  : `https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/L${num}.htm`;
                return (
                  <a
                    href={searchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Ver texto oficial no Planalto
                  </a>
                );
              }
              return null;
            })()}
          </div>
        </div>
      ) : !isPremium ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-amber-500/20 to-primary/20 p-2 border border-amber-500/30 flex items-center justify-center mb-3 shadow-lg shadow-primary/20">
            <img src={horusOwl} alt="Horus" className="w-12 h-12 object-contain" />
          </div>
          <h4 className="font-display text-lg font-bold text-foreground mb-1.5">
            Explicação com IA é Exclusivo Prime
          </h4>
          <p className="text-xs text-muted-foreground max-w-xs mb-4 leading-relaxed">
            Destrinche dispositivos complexos com explicações didáticas, linguagem clara e doutrina aplicada geradas pela nossa IA jurídica.
          </p>
          <button
            onClick={() => openPremiumGate('explicacao')}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-lg shadow-primary/30 active:scale-95 transition-all flex items-center gap-2"
          >
            <Crown className="w-4 h-4 fill-current" /> Começar 3 dias grátis
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {aiLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground font-body">
                Gerando explicação com IA...
              </p>
            </div>
          ) : aiContent ? (
            (() => {
              const sections = splitSections(aiContent, '---SECAO---');
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
                <Accordion type="multiple" className="space-y-2">
                  {sections.map((sec, i) => {
                    const borderColors = [
                      'border-l-red-500/70',
                      'border-l-amber-500/70',
                      'border-l-emerald-500/70',
                      'border-l-sky-500/70',
                      'border-l-violet-500/70',
                      'border-l-pink-500/70',
                      'border-l-orange-500/70',
                    ];
                    const strongColors = [
                      '[&_strong]:text-red-400',
                      '[&_strong]:text-amber-400',
                      '[&_strong]:text-emerald-400',
                      '[&_strong]:text-sky-400',
                      '[&_strong]:text-violet-400',
                      '[&_strong]:text-pink-400',
                      '[&_strong]:text-orange-400',
                    ];
                    return (
                      <AccordionItem
                        key={i}
                        value={`exp-${i}`}
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
            <p className="text-muted-foreground text-sm text-center py-8">
              Clique para gerar a explicação.
            </p>
          )}
        </div>
      )}
    </TabsContent>
  );
};
