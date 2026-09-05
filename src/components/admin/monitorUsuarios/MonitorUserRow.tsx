import React from 'react';
import { motion } from 'framer-motion';
import {
  formatPreciseTime,
  getRouteLabel,
  type NormalizedUser,
} from './monitorUsuariosConstants';

interface MonitorUserRowProps {
  user: NormalizedUser;
  index: number;
  onClick: (u: NormalizedUser) => void;
}

export function MonitorUserRow({ user, index, onClick }: MonitorUserRowProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={() => onClick(user)}
      className="w-full text-left rounded-xl bg-secondary/40 border border-border/30 p-3 flex items-center gap-3 hover:bg-secondary/60 transition-colors active:scale-[0.98]"
    >
      <div className="relative shrink-0">
        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground uppercase">
          {(user.email || user.name)?.[0] ?? '?'}
        </div>
        {user.isOnline && (
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background animate-pulse" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground truncate">{user.name || user.email}</p>
        <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
      </div>
      <div className="text-right shrink-0">
        {user.accesses != null ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[11px] font-bold">
            {user.accesses}× acessos
          </span>
        ) : (
          <p className="text-[10px] font-medium text-primary truncate max-w-[130px]">
            {getRouteLabel(user.route)}
          </p>
        )}
        <p className="text-[9px] text-muted-foreground mt-0.5">{formatPreciseTime(user.time)}</p>
      </div>
    </motion.button>
  );
}
