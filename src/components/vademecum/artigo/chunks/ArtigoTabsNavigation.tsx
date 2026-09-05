import React, { memo } from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ModificationInfo } from '../artigoConstants';

interface ArtigoTabsNavigationProps {
  modificationInfo?: ModificationInfo | null;
}

export const ArtigoTabsNavigation = memo(function ArtigoTabsNavigation({
  modificationInfo,
}: ArtigoTabsNavigationProps) {
  if (modificationInfo) {
    return (
      <TabsList className="mx-5 bg-secondary/60 rounded-2xl h-11 grid grid-cols-2 w-auto p-1">
        <TabsTrigger
          value="artigo"
          className="rounded-xl text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2"
        >
          Artigo
        </TabsTrigger>
        <TabsTrigger
          value="explicacao"
          className="rounded-xl text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2"
        >
          Explicação
        </TabsTrigger>
      </TabsList>
    );
  }

  return (
    <TabsList className="mx-5 bg-secondary/60 rounded-2xl h-11 grid grid-cols-4 w-auto p-1">
      <TabsTrigger
        value="artigo"
        className="rounded-xl text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2"
      >
        Artigo
      </TabsTrigger>
      <TabsTrigger
        value="explicacao"
        className="rounded-xl text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2"
      >
        Explicação
      </TabsTrigger>
      <TabsTrigger
        value="exemplo"
        className="rounded-xl text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2"
      >
        Exemplo
      </TabsTrigger>
      <TabsTrigger
        value="historico"
        className="rounded-xl text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2"
      >
        Histórico
      </TabsTrigger>
    </TabsList>
  );
});
