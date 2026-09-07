export const formatDate = (date: Date | number | string, pattern = 'dd/MM/yyyy') => {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  
  if (pattern === 'dd/MM/yyyy') return \\/\/\\;
  if (pattern === 'dd/MM/yyyy HH:mm') return \\/\/\ \:\\;
  if (pattern === 'dd MMM, yyyy') return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
  if (pattern === 'MMMM yyyy') return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(d);
  if (pattern === 'dd MMM yyyy') return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
  if (pattern === 'dd \'de\' MMMM \'de\' yyyy') return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(d);
  
  // Fallback genérico para suportar outros padrões
  return new Intl.DateTimeFormat('pt-BR').format(d);
};

export const differenceInDays = (dateLeft: Date | number | string, dateRight: Date | number | string) => {
  const left = new Date(dateLeft).setHours(0,0,0,0);
  const right = new Date(dateRight).setHours(0,0,0,0);
  return Math.round((left - right) / (1000 * 60 * 60 * 24));
};

export const addDays = (date: Date | number | string, amount: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
};

export const isToday = (date: Date | number | string) => {
  const d = new Date(date);
  const today = new Date();
  return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
};

export const isYesterday = (date: Date | number | string) => {
  const d = new Date(date);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return d.getDate() === yesterday.getDate() && d.getMonth() === yesterday.getMonth() && d.getFullYear() === yesterday.getFullYear();
};

export const parseISO = (dateStr: string) => new Date(dateStr);

export const formatDistanceToNow = (date: Date | number | string, options?: { addSuffix?: boolean }) => {
  const d = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  let result = '';
  if (diffInSeconds < 60) result = 'agora mesmo';
  else if (diffInMinutes < 60) result = \\ minuto\\;
  else if (diffInHours < 24) result = \\ hora\\;
  else if (diffInDays < 30) result = \\ dia\\;
  else if (diffInMonths < 12) result = \\ mês\\;
  else result = \\ ano\\;

  if (options?.addSuffix && result !== 'agora mesmo') {
    return \há \\;
  }
  return result;
};
