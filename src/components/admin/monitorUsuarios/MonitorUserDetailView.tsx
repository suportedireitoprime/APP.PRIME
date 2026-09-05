import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Timer, UserCheck, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  formatDuration,
  formatPreciseTime,
  type UserDetail,
} from './monitorUsuariosConstants';

interface MonitorUserDetailViewProps {
  userDetail: UserDetail;
}

export function MonitorUserDetailView({ userDetail }: MonitorUserDetailViewProps) {
  return (
    <motion.div
      key="user-detail-panel"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      className="p-4 max-w-3xl mx-auto space-y-4"
    >
      <div className="rounded-2xl bg-secondary/40 border border-border/30 p-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-lg font-bold text-foreground uppercase">
          {(userDetail.email || userDetail.name)?.[0] ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">
            {userDetail.email || userDetail.name}
          </p>
          <p className="text-xs text-muted-foreground truncate">{userDetail.name}</p>
          <span
            className={cn(
              'inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold',
              userDetail.isRecurrent
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-blue-500/20 text-blue-400',
            )}
          >
            {userDetail.isRecurrent ? (
              <>
                <UserCheck className="w-3 h-3" /> Recorrente
              </>
            ) : (
              <>
                <UserPlus className="w-3 h-3" /> Novo
              </>
            )}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total de acessos', value: String(userDetail.totalAccesses), color: 'text-primary' },
          { label: 'Dias distintos', value: String(userDetail.distinctDays), color: 'text-cyan-400' },
          {
            label: 'Tempo total no app',
            value: formatDuration(userDetail.totalTimeMs),
            color: 'text-emerald-400',
          },
          { label: 'Último acesso', value: formatPreciseTime(userDetail.lastSeen), color: 'text-amber-400' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl bg-secondary/40 border border-border/30 p-3 text-center">
            <p className={`text-base font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-secondary/40 border border-border/30 p-4">
        <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          Rotas visitadas
        </p>
        {userDetail.routes.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Sem dados</p>
        ) : (
          <div className="space-y-2">
            {userDetail.routes.map((r, i) => {
              const maxMs = userDetail.routes[0]?.totalMs || 1;
              const pct = Math.max(3, Math.round((r.totalMs / maxMs) * 100));
              return (
                <div key={r.label} className="rounded-xl bg-secondary/60 border border-border/20 p-3">
                  <div className="flex items-center justify-between mb-1.5 gap-2">
                    <span className="text-xs font-semibold text-foreground truncate flex-1">{r.label}</span>
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 shrink-0">
                      <Timer className="w-3 h-3" />
                      {formatDuration(r.totalMs)}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{r.count} acessos</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: pct / 100 }}
                      style={{ transformOrigin: 'left' }}
                      transition={{ delay: i * 0.05, duration: 0.5 }}
                      className="h-full w-full rounded-full bg-primary"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
