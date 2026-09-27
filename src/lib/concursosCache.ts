// Cache em memória de alta performance (0ms) compartilhado entre RadarConcursos e Concursos
let memoryConcursosCache: any[] = [];

export function getSharedConcursos(): any[] {
  return memoryConcursosCache;
}

export function setSharedConcursos(data: any[]): void {
  if (Array.isArray(data) && data.length > 0) {
    memoryConcursosCache = data;
  }
}
