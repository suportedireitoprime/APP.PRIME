CREATE INDEX IF NOT EXISTS idx_fc_cards_area ON public.flashcards_cards (area);
CREATE INDEX IF NOT EXISTS idx_fc_cards_area_tema ON public.flashcards_cards (area, tema);
CREATE INDEX IF NOT EXISTS idx_fc_prog_user_card ON public.flashcards_progresso (user_id, card_id);
CREATE INDEX IF NOT EXISTS idx_fc_prog_user_status ON public.flashcards_progresso (user_id, status);
CREATE INDEX IF NOT EXISTS idx_fc_deck_itens_deck ON public.flashcards_deck_itens (deck_id);
ANALYZE public.flashcards_cards;