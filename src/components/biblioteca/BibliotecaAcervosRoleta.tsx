import React, { Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLECOES } from '@/lib/bibliotecaColecoes';
import { lazyWithRetry } from "@/utils/lazyWithRetry";

const CircularGallery = lazyWithRetry(() => import('@/components/ui/CircularGallery'));

interface BibliotecaAcervosRoletaProps {
  counts: Record<string, number>;
}

export const BibliotecaAcervosRoleta: React.FC<BibliotecaAcervosRoletaProps> = ({ counts }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4 pt-6">
      <div className="flex items-start justify-between px-4 mb-4 gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-[22px] font-black text-white uppercase tracking-widest mb-1">
            Acervos de Livros
          </h2>
          <p className="text-[13px] text-zinc-400 truncate">
            Explore as coleções completas por área, autor e temática jurídica.
          </p>
        </div>
      </div>
      <div style={{ height: '350px', position: 'relative' }} className="-mx-4">
        <Suspense
          fallback={
            <div className="h-[350px] w-full flex items-center justify-center text-zinc-600 text-xs">
              Carregando acervos...
            </div>
          }
        >
          <CircularGallery
            items={COLECOES.map((c) => {
              const count = counts[c.id];
              return {
                image: c.cover,
                text: c.label,
                badgeText: count ? `${count} livros` : undefined,
                showPlayButton: false,
                id: c.id,
              };
            })}
            bend={1.5}
            textColor="#ffffff"
            scrollEase={0.15}
            borderRadius={0.05}
            onItemClick={(item) => {
              navigate(`/bibliotecas/${item.id}`);
            }}
          />
        </Suspense>
      </div>
    </div>
  );
};
