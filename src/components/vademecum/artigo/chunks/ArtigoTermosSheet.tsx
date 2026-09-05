import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { BookOpen, Loader2, X } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { splitSections } from '../artigoTextUtils';

interface ArtigoTermosSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  content?: string | null;
  fontSize: number;
}

export const ArtigoTermosSheet = memo(function ArtigoTermosSheet({
  open,
  onOpenChange,
  loading,
  content,
  fontSize,
}: ArtigoTermosSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="z-[10041] h-[90vh] max-w-lg mx-auto rounded-t-3xl p-0 flex flex-col md:left-auto md:right-0 md:top-0 md:bottom-0 md:h-full md:w-[min(30rem,92vw)] md:max-w-none md:rounded-none md:rounded-l-3xl md:border-l md:mx-0"
      >
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <BookOpen className="w-5 h-5 text-orange-400" />
          <h3 className="font-heading text-base font-semibold text-foreground flex-1">
            Termos jurídicos
          </h3>
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center text-foreground/70"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground font-body">
                Analisando termos jurídicos com IA...
              </p>
            </div>
          ) : content ? (
            (() => {
              const sections = splitSections(content, '---TERMO---');
              if (sections.length <= 1) {
                return (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none font-body leading-relaxed [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 [&_h2]:font-bold [&_h2]:text-foreground [&_h3]:font-bold [&_strong]:text-foreground"
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    <ReactMarkdown>{content}</ReactMarkdown>
                  </div>
                );
              }
              return (
                <Accordion type="single" collapsible className="space-y-2">
                  {sections.map((sec, i) => {
                    const borderColors = [
                      'border-l-pink-500/70',
                      'border-l-orange-500/70',
                      'border-l-cyan-500/70',
                      'border-l-red-500/70',
                      'border-l-indigo-500/70',
                      'border-l-lime-500/70',
                    ];
                    const strongColors = [
                      '[&_strong]:text-pink-400',
                      '[&_strong]:text-orange-400',
                      '[&_strong]:text-cyan-400',
                      '[&_strong]:text-red-400',
                      '[&_strong]:text-indigo-400',
                      '[&_strong]:text-lime-400',
                    ];
                    return (
                      <AccordionItem
                        key={i}
                        value={`term-${i}`}
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
            <p className="text-muted-foreground text-sm text-center py-8">Carregando termos...</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
});
