import { BiografiaData } from '@/types/biografia';
import { socratesData } from './socrates';
import { hansKelsenData } from './hansKelsen';

export const todasBiografias: BiografiaData[] = [
  socratesData,
  hansKelsenData,
];

export const getBiografiasByCategoria = (categoriaId: string) => {
  return todasBiografias.filter((b) => b.categoriaId === categoriaId);
};

export const getBiografiaById = (id: string) => {
  return todasBiografias.find((b) => b.id === id);
};
