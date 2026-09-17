/**
 * Utilitário para exportação de eventos para calendários (iCal / .ics e Google Calendar)
 * Padrão RFC 5545 compatível nativamente com iOS Calendar, Android, Google Calendar, Outlook e macOS.
 */

export interface CalendarEventData {
  title: string;
  description?: string;
  location?: string;
  startTime: string; // ISO string ou YYYY-MM-DDTHH:mm:ss
  endTime?: string;
  url?: string;
}

const formatDateToICS = (dateStr: string): string => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    const clean = dateStr.replace(/[-:]/g, '').split('.')[0];
    return clean.includes('T') ? clean : `${clean}T000000`;
  }
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

/**
 * Gera e dispara o download de um arquivo .ics
 */
export const downloadICS = (event: CalendarEventData, filename = 'evento-senado.ics') => {
  const dtStart = formatDateToICS(event.startTime);
  
  // Se não houver fim especificado, padrão de 2 horas de duração
  let dtEnd = event.endTime ? formatDateToICS(event.endTime) : '';
  if (!dtEnd) {
    const startDate = new Date(event.startTime);
    if (!isNaN(startDate.getTime())) {
      const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
      dtEnd = formatDateToICS(endDate.toISOString());
    } else {
      dtEnd = dtStart;
    }
  }

  const cleanDescription = (event.description || '')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');

  const cleanLocation = (event.location || 'Senado Federal - Brasília, DF')
    .replace(/,/g, '\\,');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Direito Prime//Agenda Legislativa//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@direitoprime.com.br`,
    `DTSTAMP:${formatDateToICS(new Date().toISOString())}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${cleanDescription}${event.url ? `\\n\\nMais detalhes: ${event.url}` : ''}`,
    `LOCATION:${cleanLocation}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Lembrete de Sessão do Senado Federal',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Gera URL direta para adicionar no Google Calendar na Web
 */
export const getGoogleCalendarUrl = (event: CalendarEventData): string => {
  const dtStart = formatDateToICS(event.startTime);
  let dtEnd = event.endTime ? formatDateToICS(event.endTime) : '';
  if (!dtEnd) {
    const startDate = new Date(event.startTime);
    if (!isNaN(startDate.getTime())) {
      const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
      dtEnd = formatDateToICS(endDate.toISOString());
    } else {
      dtEnd = dtStart;
    }
  }

  const details = `${event.description || ''}${event.url ? `\n\nLink Oficial: ${event.url}` : ''}`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${dtStart}/${dtEnd}`,
    details,
    location: event.location || 'Senado Federal - Brasília, DF'
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};
