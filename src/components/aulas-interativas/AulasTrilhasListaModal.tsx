import React from 'react';
import { AulasTrilhasFullScreen } from './AulasTrilhasFullScreen';
import { DisciplinaItem } from '@/data/disciplinasAulasCatalogo';
import { AulaItem } from '@/data/aulasInterativasCatalogoCompleto';
import { TrilhaModuloAula } from '@/data/aulasTrilhasModulosOficiais';

export interface AulasTrilhasListaModalProps {
  isOpen: boolean;
  onClose: () => void;
  disciplinas: DisciplinaItem[];
  aulas: AulaItem[];
  faseSelecionadaId: string | null;
  onSelectFase: (faseId: string | null) => void;
  onIniciarAula?: (aulaItem: TrilhaModuloAula | AulaItem) => void;
  moduloInicialId?: string | null;
  calcularProgressoCiclo?: (aula: AulaItem) => {
    aulaTerminada: boolean;
    porcentagemTotal: number;
  };
}

export const AulasTrilhasListaModal: React.FC<AulasTrilhasListaModalProps> = (props) => {
  return <AulasTrilhasFullScreen {...props} />;
};

export default AulasTrilhasListaModal;
