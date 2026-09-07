/**
 * AdminImageTelemetry.tsx — Fase 20 de Otimização de Imagens
 * 
 * Dashboard de telemetria de imagens para o painel administrativo.
 * Exibe métricas de performance em tempo real:
 * - LCP (Largest Contentful Paint) da imagem mais impactante
 * - Lista de imagens lentas (> 2.5s) capturadas na sessão
 * - Estatísticas do cache offline (IndexedDB)
 * - Qualidade adaptativa de rede ativa
 */
import React, { useState, useEffect, useCallback } from 'react';
import { getLatestImageLcp, subscribeImageLcp, getSlowImagesLog, type ImageLcpMetric, type ImageLoadMetric } from '@/lib/imageTelemetry';
import { getImageCacheStats } from '@/services/imageOfflineStore';
import { getAdaptiveQuality } from '@/lib/cdnImg';
import { Activity, Image as ImageIcon, Zap, Database, Wifi, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface CacheStats {
  count: number;
  totalSizeBytes: number;
}

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getRatingColor = (rating: string): string => {
  switch (rating) {
    case 'good': return 'text-emerald-400';
    case 'needs-improvement': return 'text-amber-400';
    case 'poor': return 'text-red-400';
    default: return 'text-zinc-400';
  }
};

const getRatingIcon = (rating: string) => {
  switch (rating) {
    case 'good': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    case 'needs-improvement': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    case 'poor': return <AlertTriangle className="w-4 h-4 text-red-400" />;
    default: return <Clock className="w-4 h-4 text-zinc-400" />;
  }
};

export default function AdminImageTelemetry() {
  const [lcp, setLcp] = useState<ImageLcpMetric | null>(getLatestImageLcp());
  const [slowImages, setSlowImages] = useState<readonly ImageLoadMetric[]>([]);
  const [cacheStats, setCacheStats] = useState<CacheStats>({ count: 0, totalSizeBytes: 0 });
  const [adaptiveQuality, setAdaptiveQuality] = useState<number>(80);

  // Assinatura reativa no LCP observer
  useEffect(() => {
    const unsub = subscribeImageLcp((metric) => {
      setLcp(metric);
    });
    return unsub;
  }, []);

  // Atualiza slow images e cache stats periodicamente
  const refreshStats = useCallback(async () => {
    setSlowImages(getSlowImagesLog());
    setAdaptiveQuality(getAdaptiveQuality(80));
    try {
      const stats = await getImageCacheStats();
      setCacheStats(stats);
    } catch {
      // Silencia erros de IndexedDB
    }
  }, []);

  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 5000);
    return () => clearInterval(interval);
  }, [refreshStats]);

  const extractFilename = (url: string): string => {
    try {
      const pathname = new URL(url, 'https://local').pathname;
      return pathname.split('/').pop() || url;
    } catch {
      return url.slice(-50);
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
          <Activity className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide">Telemetria de Imagens</h2>
          <p className="text-xs text-zinc-500">Performance em tempo real · Core Web Vitals</p>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* LCP */}
        <div className="rounded-xl bg-zinc-900/80 border border-white/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">LCP</span>
          </div>
          {lcp ? (
            <div>
              <span className={`text-2xl font-bold ${getRatingColor(lcp.rating)}`}>
                {lcp.durationMs}ms
              </span>
              <div className="flex items-center gap-1 mt-1">
                {getRatingIcon(lcp.rating)}
                <span className="text-[10px] text-zinc-500 capitalize">{lcp.rating.replace('-', ' ')}</span>
              </div>
            </div>
          ) : (
            <span className="text-2xl font-bold text-zinc-600">—</span>
          )}
        </div>

        {/* Slow Images Count */}
        <div className="rounded-xl bg-zinc-900/80 border border-white/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Lentas</span>
          </div>
          <span className={`text-2xl font-bold ${slowImages.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {slowImages.length}
          </span>
          <p className="text-[10px] text-zinc-500 mt-1">&gt; 2.5s na sessão</p>
        </div>

        {/* Cache Offline */}
        <div className="rounded-xl bg-zinc-900/80 border border-white/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Cache</span>
          </div>
          <span className="text-2xl font-bold text-blue-400">{cacheStats.count}</span>
          <p className="text-[10px] text-zinc-500 mt-1">{formatBytes(cacheStats.totalSizeBytes)} offline</p>
        </div>

        {/* Adaptive Quality */}
        <div className="rounded-xl bg-zinc-900/80 border border-white/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wifi className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Qualidade</span>
          </div>
          <span className={`text-2xl font-bold ${adaptiveQuality >= 80 ? 'text-emerald-400' : adaptiveQuality >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
            {adaptiveQuality}%
          </span>
          <p className="text-[10px] text-zinc-500 mt-1">
            {adaptiveQuality >= 80 ? '4G/Wi-Fi' : adaptiveQuality >= 60 ? '3G' : '2G/SaveData'}
          </p>
        </div>
      </div>

      {/* LCP Detail */}
      {lcp && (
        <div className="rounded-xl bg-zinc-900/80 border border-white/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <ImageIcon className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-white">Último LCP Detectado</span>
          </div>
          <div className="space-y-2 text-xs text-zinc-400">
            <div className="flex justify-between">
              <span>Arquivo:</span>
              <span className="text-zinc-300 truncate max-w-[60%]">{extractFilename(lcp.url)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tamanho:</span>
              <span className="text-zinc-300">{lcp.sizePixels.toLocaleString()}px²</span>
            </div>
            <div className="flex justify-between">
              <span>Rota:</span>
              <span className="text-zinc-300">{lcp.pathname}</span>
            </div>
            <div className="flex justify-between">
              <span>Horário:</span>
              <span className="text-zinc-300">{new Date(lcp.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Slow Images List */}
      {slowImages.length > 0 && (
        <div className="rounded-xl bg-zinc-900/80 border border-white/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-semibold text-white">Imagens Lentas ({slowImages.length})</span>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {[...slowImages].reverse().map((img, i) => (
              <div key={`${img.url}-${img.timestamp}-${i}`} className="flex items-center justify-between py-2 px-3 rounded-lg bg-zinc-800/50 border border-white/5">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-300 truncate">{extractFilename(img.url)}</p>
                  <p className="text-[10px] text-zinc-500">{img.pathname} · {new Date(img.timestamp).toLocaleTimeString()}</p>
                </div>
                <span className="text-sm font-bold text-red-400 ml-3 shrink-0">{img.durationMs}ms</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {slowImages.length === 0 && !lcp && (
        <div className="text-center py-12">
          <CheckCircle2 className="w-12 h-12 text-emerald-400/30 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">Nenhuma anomalia detectada nesta sessão.</p>
          <p className="text-xs text-zinc-600 mt-1">Navegue pelo app para coletar métricas de imagens.</p>
        </div>
      )}
    </div>
  );
}
