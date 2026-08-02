ALTER TABLE public.flashcards_cards ADD COLUMN origem_id bigint;
CREATE UNIQUE INDEX idx_fc_cards_origem_id ON public.flashcards_cards (origem_id);