import React from 'react';
import { CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import {
  formatPreciseTime,
  type NormalizedUser,
} from './monitorUsuariosConstants';

interface MonitorDayUsersCardProps {
  selectedDate: Date;
  setSelectedDate: (d: Date) => void;
  calendarOpen: boolean;
  setCalendarOpen: (open: boolean) => void;
  loadingDate: boolean;
  dateUniqueUsers: NormalizedUser[];
  onUserClick: (u: NormalizedUser) => void;
}

export function MonitorDayUsersCard({
  selectedDate,
  setSelectedDate,
  calendarOpen,
  setCalendarOpen,
  loadingDate,
  dateUniqueUsers,
  onUserClick,
}: MonitorDayUsersCardProps) {
  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const dateLabel = isToday ? 'Hoje' : format(selectedDate, "dd 'de' MMMM", { locale: ptBR });

  return (
    <div className="rounded-2xl bg-secondary/40 border border-border/30 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border/30 flex items-center gap-2">
        <CalendarDays className="w-4 h-4 text-primary" />
        <p className="text-xs font-bold text-foreground">Usuários do dia</p>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="secondary" size="sm" className="ml-auto h-7 text-[11px] gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" />
              {dateLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => {
                if (d) {
                  const nd = new Date(d);
                  nd.setHours(0, 0, 0, 0);
                  setSelectedDate(nd);
                  setCalendarOpen(false);
                }
              }}
              disabled={(d) => d > new Date()}
              locale={ptBR}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {loadingDate ? (
        <div className="py-8 flex justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : dateUniqueUsers.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8">Nenhum usuário neste dia</p>
      ) : (
        <div className="divide-y divide-border/20 max-h-96 overflow-y-auto">
          {dateUniqueUsers.map((u) => (
            <button
              key={u.id}
              onClick={() => onUserClick(u)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/70 transition-colors text-left"
            >
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[11px] font-bold text-foreground uppercase">
                  {(u.email || u.name)?.[0] ?? '?'}
                </div>
                {u.isOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background animate-pulse" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{u.name || u.email}</p>
                <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
              </div>
              <div className="text-right shrink-0 flex flex-col items-end">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[11px] font-bold">
                  {u.accesses ?? 1}× acessos
                </span>
                <p className="text-[9px] text-muted-foreground mt-0.5">
                  último {formatPreciseTime(u.time)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
