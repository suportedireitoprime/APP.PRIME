export const Visemes: Record<string, string> = {
  'sil': 'M 30 70 Q 50 68 70 70 Q 50 72 30 70',
  'PP': 'M 35 70 Q 50 68 65 70 Q 50 72 35 70',
  'FF': 'M 35 68 Q 50 65 65 68 Q 50 72 35 68',
  'TH': 'M 30 65 Q 50 60 70 65 Q 50 75 30 65',
  'DD': 'M 30 65 Q 50 55 70 65 Q 50 80 30 65',
  'kk': 'M 25 60 Q 50 50 75 60 Q 50 90 25 60',
  'CH': 'M 30 60 Q 50 55 70 60 Q 50 80 30 60',
  'SS': 'M 35 65 Q 50 60 65 65 Q 50 70 35 65',
  'nn': 'M 30 65 Q 50 60 70 65 Q 50 75 30 65',
  'RR': 'M 30 65 Q 50 60 70 65 Q 50 75 30 65',
  'aa': 'M 20 60 Q 50 40 80 60 Q 50 100 20 60',
  'E': 'M 25 60 Q 50 50 75 60 Q 50 85 25 60',
  'I': 'M 30 65 Q 50 60 70 65 Q 50 75 30 65',
  'O': 'M 40 60 Q 50 50 60 60 Q 50 80 40 60',
  'U': 'M 45 65 Q 50 60 55 65 Q 50 75 45 65',
};

export const getMouthPath = (viseme: string) => {
  const key = (viseme || 'sil').replace('viseme_', '');
  return Visemes[key] || Visemes['sil'];
};
