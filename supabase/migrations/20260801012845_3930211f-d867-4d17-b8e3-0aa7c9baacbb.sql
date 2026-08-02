CREATE INDEX IF NOT EXISTS idx_videoaulas_progresso_tabela_video ON public.videoaulas_progresso (tabela, video_id);
CREATE INDEX IF NOT EXISTS idx_videoaulas_progresso_updated ON public.videoaulas_progresso (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_videoaulas_favoritos_tabela_created ON public.videoaulas_favoritos (tabela, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videoaulas_areas_direito_area_ordem ON public.videoaulas_areas_direito (area, ordem);
CREATE INDEX IF NOT EXISTS idx_videoaulas_oab_primeira_area_ordem ON public.videoaulas_oab_primeira_fase (area, ordem);
CREATE INDEX IF NOT EXISTS idx_videoaulas_oab_segunda_area_ordem ON public.videoaulas_oab_segunda_fase (area, ordem);
CREATE INDEX IF NOT EXISTS idx_videoaulas_iniciante_ordem ON public.videoaulas_iniciante (ordem);