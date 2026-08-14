import { BiografiaData } from '@/types/biografia';
import { socratesData } from './socrates';

export const todasBiografias: BiografiaData[] = [
  socratesData,
];

export const getBiografiasByCategoria = (categoriaId: string) => {
  return todasBiografias.filter((b) => b.categoriaId === categoriaId);
};

export const getBiografiaById = (id: string) => {
  return todasBiografias.find((b) => b.id === id);
};
