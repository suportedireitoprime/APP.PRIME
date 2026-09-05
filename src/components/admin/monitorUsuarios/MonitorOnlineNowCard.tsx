import React from 'react';
import {
  formatPreciseTime,
  getRouteLabel,
  type NormalizedUser,
  type PresenceUser,
} from './monitorUsuariosConstants';

interface MonitorOnlineNowCardProps {
  realtimeUsers: PresenceUser[];
  onUserClick: (u: NormalizedUser) => void;
}

export function MonitorOnlineNowCard({ realtimeUsers, onUserClick }: MonitorOnlineNowCardProps) {
  return (
    <div className="rounded-2xl bg-secondary/40 border border-border/30 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border/30 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <p className="text-xs font-bold text-foreground">Online agora</p>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {realtimeUsers.length} conectado{realtimeUsers.length === 1 ? '' : 's'}
        </span>
      </div>
      {realtimeUsers.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">Ninguém online no momento</p>
      ) : (
        <div className="divide-y divide-border/20 max-h-72 overflow-y-auto">
          {realtimeUsers.map((u) => (
            <button
              key={u.user_id}
              onClick={() =>
                onUserClick({
                  id: u.user_id,
                  email: u.email,
                  name: u.display_name,
                  route: u.current_route,
                  time: u.online_at,
                  isOnline: true,
                })
              }
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/70 transition-colors text-left"
            >
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[11px] font-bold text-foreground uppercase">
                  {(u.email || u.display_name)?.[0] ?? '?'}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">
                  {u.display_name || u.email}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] font-medium text-primary truncate max-w-[120px]">
                  {getRouteLabel(u.current_route)}
                </p>
                <p className="text-[9px] text-muted-foreground">{formatPreciseTime(u.online_at)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
