export interface MouthShape {
  lips: string;
  opening: string;
  tongue: string;
  openAmount: number;
}

// Format: 
// lips:    Outer contour
// opening: Inner contour (the dark void)
// tongue:  The tongue contour inside the void
export const MouthShapes: Record<string, MouthShape> = {
  'sil': {
    lips:    'M 30 70 Q 50 68 70 70 Q 50 72 30 70',
    opening: 'M 32 70 Q 50 69 68 70 Q 50 71 32 70',
    tongue:  'M 40 70 Q 50 69 60 70 Q 50 70 40 70',
    openAmount: 0,
  },
  'PP': {
    lips:    'M 30 70 Q 50 69 70 70 Q 50 71 30 70',
    opening: 'M 30 70 Q 50 70 70 70 Q 50 70 30 70',
    tongue:  'M 50 70 Q 50 70 50 70 Q 50 70 50 70',
    openAmount: 0,
  },
  'FF': {
    lips:    'M 32 68 Q 50 62 68 68 Q 50 70 32 68',
    opening: 'M 35 68 Q 50 65 65 68 Q 50 69 35 68',
    tongue:  'M 45 68 Q 50 67 55 68 Q 50 69 45 68',
    openAmount: 0.1,
  },
  'TH': {
    lips:    'M 30 66 Q 50 58 70 66 Q 50 74 30 66',
    opening: 'M 35 66 Q 50 62 65 66 Q 50 70 35 66',
    tongue:  'M 38 66 Q 50 60 62 66 Q 50 74 38 66',
    openAmount: 0.2,
  },
  'DD': {
    lips:    'M 28 66 Q 50 56 72 66 Q 50 76 28 66',
    opening: 'M 32 66 Q 50 60 68 66 Q 50 72 32 66',
    tongue:  'M 36 68 Q 50 64 64 68 Q 50 72 36 68',
    openAmount: 0.4,
  },
  'kk': {
    lips:    'M 26 65 Q 50 55 74 65 Q 50 80 26 65',
    opening: 'M 30 65 Q 50 58 70 65 Q 50 76 30 65',
    tongue:  'M 36 70 Q 50 65 64 70 Q 50 76 36 70',
    openAmount: 0.6,
  },
  'CH': {
    lips:    'M 30 65 Q 50 55 70 65 Q 50 78 30 65',
    opening: 'M 34 65 Q 50 58 66 65 Q 50 74 34 65',
    tongue:  'M 38 68 Q 50 62 62 68 Q 50 74 38 68',
    openAmount: 0.5,
  },
  'SS': {
    lips:    'M 28 68 Q 50 62 72 68 Q 50 72 28 68',
    opening: 'M 32 68 Q 50 64 68 68 Q 50 70 32 68',
    tongue:  'M 40 68 Q 50 66 60 68 Q 50 70 40 68',
    openAmount: 0.2,
  },
  'nn': {
    lips:    'M 28 66 Q 50 60 72 66 Q 50 74 28 66',
    opening: 'M 32 66 Q 50 62 68 66 Q 50 70 32 66',
    tongue:  'M 35 68 Q 50 60 65 68 Q 50 70 35 68',
    openAmount: 0.3,
  },
  'RR': {
    lips:    'M 30 65 Q 50 55 70 65 Q 50 75 30 65',
    opening: 'M 34 65 Q 50 58 66 65 Q 50 71 34 65',
    tongue:  'M 38 68 Q 50 62 62 68 Q 50 71 38 68',
    openAmount: 0.4,
  },
  'aa': {
    lips:    'M 25 65 Q 50 50 75 65 Q 50 95 25 65',
    opening: 'M 30 65 Q 50 55 70 65 Q 50 85 30 65',
    tongue:  'M 35 75 Q 50 65 65 75 Q 50 85 35 75',
    openAmount: 1.0,
  },
  'E': {
    lips:    'M 25 65 Q 50 55 75 65 Q 50 85 25 65',
    opening: 'M 30 65 Q 50 60 70 65 Q 50 78 30 65',
    tongue:  'M 35 72 Q 50 65 65 72 Q 50 78 35 72',
    openAmount: 0.6,
  },
  'I': {
    lips:    'M 25 68 Q 50 60 75 68 Q 50 75 25 68',
    opening: 'M 30 68 Q 50 64 70 68 Q 50 72 30 68',
    tongue:  'M 40 70 Q 50 68 60 70 Q 50 72 40 70',
    openAmount: 0.3,
  },
  'O': {
    lips:    'M 38 60 Q 50 50 62 60 Q 50 80 38 60',
    opening: 'M 42 62 Q 50 55 58 62 Q 50 75 42 62',
    tongue:  'M 45 70 Q 50 65 55 70 Q 50 75 45 70',
    openAmount: 0.8,
  },
  'U': {
    lips:    'M 40 65 Q 50 55 60 65 Q 50 75 40 65',
    opening: 'M 43 65 Q 50 60 57 65 Q 50 70 43 65',
    tongue:  'M 46 68 Q 50 65 54 68 Q 50 70 46 68',
    openAmount: 0.4,
  },
};

export const getMouthShape = (viseme: string): MouthShape => {
  const key = (viseme || 'sil').replace('viseme_', '');
  return MouthShapes[key] || MouthShapes['sil'];
};
