-- Create shared_decks table for sharing flashcards
CREATE TABLE IF NOT EXISTS public.shared_decks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deck_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Setup RLS
ALTER TABLE public.shared_decks ENABLE ROW LEVEL SECURITY;

-- Anyone can read a shared deck (it's public by link)
CREATE POLICY "Shared decks are viewable by everyone" ON public.shared_decks
    FOR SELECT USING (true);

-- Authenticated users can insert their own decks
CREATE POLICY "Users can share their decks" ON public.shared_decks
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- Only owners can delete their shared decks
CREATE POLICY "Users can delete their shared decks" ON public.shared_decks
    FOR DELETE USING ((select auth.uid()) = user_id);
