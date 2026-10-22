import React, { useState, useMemo } from "react";
import {
  Flame,
  Scale,
  Building2,
  Briefcase,
  FileCheck2,
  ShieldAlert,
  ShoppingBag,
  Coins,
  ChevronRight,
  Search,
  X,
  Layers,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { haptic } from "@/lib/nativeHaptics";
import type { LawOption } from "./audioleiTypes";

export interface LawChipItem {
  id: string;
  sigla: string;
  nome: string;
  tabela_nome: string;
  emoji?: string;
  cor?: string;
}

const TOP_LAWS: LawChipItem[] = [
  { id: "cf88", sigla: "CF/88", nome: "Constituição Federal", tabela_nome: "CF88_CONSTITUICAO_FEDERAL", emoji: "🔥" },
  { id: "cp", sigla: "Código Penal", nome: "Código Penal", tabela_nome: "CP_CODIGO_PENAL", emoji: "⚖️" },
  { id: "cc", sigla: "Código Civil", nome: "Código Civil", tabela_nome: "CC_CODIGO_CIVIL", emoji: "🏛️" },
  { id: "clt", sigla: "CLT", nome: "Consolidação das Leis do Trabalho", tabela_nome: "CLT_CONSOLIDACAO_LEIS_TRABALHO", emoji: "💼" },
  { id: "cpc", sigla: "CPC", nome: "Código de Processo Civil", tabela_nome: "CPC_PROCESSO_CIVIL", emoji: "📑" },
  { id: "cpp", sigla: "CPP", nome: "Código de Processo Penal", tabela_nome: "CPP_PROCESSO_PENAL", emoji: "🚨" },
  { id: "cdc", sigla: "CDC", nome: "Código de Defesa do Consumidor", tabela_nome: "CDC_CONSUMIDOR", emoji: "🛍️" },
  { id: "ctn", sigla: "CTN", nome: "Código Tributário Nacional", tabela_nome: "CTN_TRIBUTARIO", emoji: "💰" },
];

interface AudioleiLawSelectorProps {
  selectedTabela: string;
  onSelectLaw: (tabela: string) => void;
  availableLaws: LawOption[];
  lawCounts?: Record<string, number>;
}

export const AudioleiLawSelector: React.FC<AudioleiLawSelectorProps> = ({
  selectedTabela,
  onSelectLaw,
  availableLaws,
  lawCounts = {},
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [searchCatalog, setSearchCatalog] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("todos");

  // Filtra as leis para a gaveta de exploração completa
  const filteredCatalog = useMemo(() => {
    let list = availableLaws;
    if (selectedCategory === "codigos") {
      list = list.filter((l) => l.tipo === "constituicao" || l.tipo === "codigo");
    } else if (selectedCategory === "estatutos") {
      list = list.filter((l) => l.tipo === "estatuto");
    } else if (selectedCategory === "especiais") {
      list = list.filter((l) => l.tipo !== "constituicao" && l.tipo !== "codigo" && l.tipo !== "estatuto");
    }

    if (!searchCatalog.trim()) return list;
    const q = searchCatalog.toLowerCase().trim();
    return list.filter(
      (l) =>
        l.nome.toLowerCase().includes(q) ||
        l.sigla.toLowerCase().includes(q) ||
        (l.descricao && l.descricao.toLowerCase().includes(q))
    );
  }, [availableLaws, searchCatalog, selectedCategory]);

  return (
    <div className="w-full space-y-2">
      {/* Barra de Chips Rápidos de Fácil Acesso ao Polegar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        {TOP_LAWS.map((law) => {
          const isSelected = selectedTabela.toLowerCase() === law.tabela_nome.toLowerCase();
          const count = lawCounts[law.tabela_nome] || 0;

          return (
            <button
              key={law.id}
              type="button"
              onClick={() => {
                haptic.selection();
                onSelectLaw(law.tabela_nome);
              }}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 border ${
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/25 scale-[1.02]"
                  : "bg-card/90 hover:bg-card text-muted-foreground hover:text-foreground border-border hover:border-border/80"
              }`}
            >
              <span>{law.emoji}</span>
              <span>{law.sigla}</span>
              {count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? "bg-black/25 text-white" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}

        {/* Botão Ver Todas as Leis */}
        <button
          type="button"
          onClick={() => {
            haptic.selection();
            setModalOpen(true);
          }}
          className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold bg-secondary/80 hover:bg-secondary text-foreground border border-border hover:border-primary/50 transition-all cursor-pointer active:scale-95"
        >
          <Layers className="w-3.5 h-3.5 text-primary" />
          <span>+ Todas as Leis ({availableLaws.length})</span>
        </button>
      </div>

      {/* Sheet para Escolher Qualquer Lei com Busca Rápida */}
      <Sheet open={modalOpen} onOpenChange={setModalOpen}>
        <SheetContent
          side="bottom"
          className="h-[88vh] sm:h-[80vh] rounded-t-3xl bg-[#0D0D0D] border-t border-border p-0 flex flex-col overflow-hidden"
        >
          {/* Puxador tátil */}
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mt-3 mb-1 shrink-0" />

          <div className="px-5 pt-3 pb-4 border-b border-border/60">
            <div className="flex items-center justify-between mb-3">
              <SheetTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <span>Catálogo de Audioleis</span>
              </SheetTitle>
              <span className="text-xs text-muted-foreground">
                {availableLaws.length} leis disponíveis
              </span>
            </div>

            {/* Campo de Busca de Leis */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchCatalog}
                onChange={(e) => setSearchCatalog(e.target.value)}
                placeholder="Pesquisar por código, estatuto ou lei (ex: Penal, ECA, CLT)..."
                className="w-full bg-card/90 border border-border rounded-xl pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60"
              />
              {searchCatalog && (
                <button
                  type="button"
                  onClick={() => setSearchCatalog("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filtro por Categoria */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: "todos", label: "Todas as Leis" },
                { id: "codigos", label: "Constituição & Códigos" },
                { id: "estatutos", label: "Estatutos" },
                { id: "especiais", label: "Legislação Especial" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`shrink-0 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    selectedCategory === cat.id
                      ? "bg-primary text-primary-foreground font-bold"
                      : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de Leis */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5">
            {filteredCatalog.map((law) => {
              const count = lawCounts[law.tabela_nome] || 0;
              const isSelected = selectedTabela.toLowerCase() === law.tabela_nome.toLowerCase();

              return (
                <div
                  key={law.id}
                  onClick={() => {
                    haptic.selection();
                    onSelectLaw(law.tabela_nome);
                    setModalOpen(false);
                  }}
                  className={`group p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? "bg-primary/10 border-primary ring-1 ring-primary/40"
                      : "bg-card/70 border-border hover:bg-card hover:border-border/90"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                        {law.sigla}
                      </span>
                      {count > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          {count} áudios
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{law.nome}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isSelected && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                        Ativa
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              );
            })}

            {filteredCatalog.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-sm">Nenhuma lei encontrada para o filtro atual.</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
