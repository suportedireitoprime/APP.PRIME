import React, { useState, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { motion } from 'framer-motion';
import { Scale, FileSignature, FileText, Briefcase, BookOpen, Landmark, FolderOpen, Loader2, Search } from 'lucide-react';
import { DocumentCard } from '@/components/documentos/DocumentCard';
import { usePastasDocumentos } from '@/hooks/useDocumentosDrive';
import DocumentosSheet from '@/components/documentos/DocumentosSheet';

const ICONS = [Scale, FileSignature, Briefcase, FileText, BookOpen, Landmark];

export default function Documentos() {
  const navigate = useNavigate();
  const { pastas, isLoading } = usePastasDocumentos();
  const [docPasta, setDocPasta] = useState<{ id: string; nome: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Determinar o ícone com base no índice
  const getIcon = (index: number) => ICONS[index % ICONS.length];

  const filteredPastas = pastas.filter(p => p.nome.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-background pb-safe flex flex-col">
      <PageHeader 
        title="Documentos" 
        subtitle="Mais de 30 mil modelos prontos para uso" 
        onBack={() => navigate('/ferramentas')} 
      />
      <div className="flex-1 p-4 pb-32 w-full max-w-4xl mx-auto">
        {/* Barra de Pesquisa */}
        <div className="mb-6 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <input
            type="text"
            className="w-full bg-[#1b233d] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Buscar em documentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p>Carregando banco de modelos...</p>
          </div>
        ) : filteredPastas.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 w-full">
            {filteredPastas.map((pasta, index) => {
              const icon = getIcon(index);
              
              // Mapeamento dinâmico de quantidades sugeridas pelo nome da pasta
              let qtde = "+1.000";
              const nomeLow = pasta.nome.toLowerCase();
              if (nomeLow.includes('peti')) { qtde = "1.240"; }
              else if (nomeLow.includes('contrato')) { qtde = "850"; }
              else if (nomeLow.includes('procura')) { qtde = "320"; }
              else if (nomeLow.includes('recurso')) { qtde = "640"; }
              else if (nomeLow.includes('juris')) { qtde = "+10.000"; }

              return (
                <motion.div key={pasta.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * index }} className="w-full">
                  <DocumentCard 
                    title={pasta.nome}
                    stat1Value={qtde}
                    stat1Label="Modelos"
                    icon={icon}
                    onClick={() => setDocPasta(pasta)}
                  />
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center mt-20">
            <div className="w-20 h-20 bg-muted/20 rounded-3xl flex items-center justify-center mb-6 border border-white/5">
              <FolderOpen className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="font-display font-bold text-xl text-foreground mb-3">
              Nenhuma pasta encontrada
            </h2>
            <p className="font-body text-sm text-muted-foreground max-w-sm">
              Não foi possível carregar as pastas de documentos do Drive no momento.
            </p>
          </div>
        )}
      </div>

      {/* Sheet para abrir o visualizador de pastas e arquivos */}
      {docPasta && (
        <Suspense fallback={null}>
          <DocumentosSheet 
            categoria={docPasta} 
            open={!!docPasta} 
            onClose={() => setDocPasta(null)} 
          />
        </Suspense>
      )}
    </div>
  );
}
