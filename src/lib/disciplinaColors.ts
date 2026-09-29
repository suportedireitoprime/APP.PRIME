export const getDisciplinaColors = (disciplina: string | undefined): string => {
  const d = (disciplina || '').toLowerCase();
  
  if (d.includes('penal')) {
    if (d.includes('processo') || d.includes('processual')) return '239, 68, 68'; // red-500
    return '220, 38, 38'; // red-600
  }
  if (d.includes('civil')) {
    if (d.includes('processo') || d.includes('processual')) return '59, 130, 246'; // blue-500
    return '37, 99, 235'; // blue-600
  }
  if (d.includes('constitucional') || d.includes('constituição')) return '16, 185, 129'; // emerald-500
  if (d.includes('administrativo')) return '245, 158, 11'; // amber-500
  if (d.includes('tributário') || d.includes('tributario')) return '139, 92, 246'; // violet-500
  if (d.includes('empresarial')) return '236, 72, 153'; // pink-500
  if (d.includes('trabalho') || d.includes('trabalhista')) return '249, 115, 22'; // orange-500
  if (d.includes('eleitoral')) return '20, 184, 166'; // teal-500
  if (d.includes('internacional')) return '14, 165, 233'; // sky-500
  if (d.includes('ambiental')) return '132, 204, 22'; // lime-500
  if (d.includes('consumidor')) return '244, 63, 94'; // rose-500
  if (d.includes('humanos')) return '168, 85, 247'; // purple-500
  if (d.includes('criança') || d.includes('eca')) return '217, 70, 239'; // fuchsia-500
  
  // Default to primary color if not matched (rose-600)
  return '225, 29, 72';
};
