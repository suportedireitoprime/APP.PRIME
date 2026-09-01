-- Migration: Forca Gamification
-- Creates the forca_progresso table to track XP, level, and combos

CREATE TABLE IF NOT EXISTS public.forca_progresso (
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    xp_total integer NOT NULL DEFAULT 0,
    level integer NOT NULL DEFAULT 1,
    best_combo integer NOT NULL DEFAULT 0,
    games_played integer NOT NULL DEFAULT 0,
    games_won integer NOT NULL DEFAULT 0,
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id)
);

-- Enable RLS
ALTER TABLE public.forca_progresso ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own progress" 
    ON public.forca_progresso 
    FOR SELECT 
    USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own progress" 
    ON public.forca_progresso 
    FOR INSERT 
    WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own progress" 
    ON public.forca_progresso 
    FOR UPDATE 
    USING ((select auth.uid()) = user_id) 
    WITH CHECK ((select auth.uid()) = user_id);

-- Create a secure RPC function to safely increment XP and update stats atomically
CREATE OR REPLACE FUNCTION public.increment_forca_stats(
    p_user_id uuid,
    p_xp_gained integer,
    p_highest_combo integer,
    p_is_win boolean
) RETURNS void AS $$
DECLARE
    v_current_xp integer;
    v_new_level integer;
BEGIN
    -- Ensure the user exists in the progress table, otherwise create them
    INSERT INTO public.forca_progresso (user_id, xp_total, level, best_combo, games_played, games_won)
    VALUES (p_user_id, 0, 1, 0, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;

    -- Update the record
    UPDATE public.forca_progresso
    SET 
        xp_total = xp_total + p_xp_gained,
        best_combo = GREATEST(best_combo, p_highest_combo),
        games_played = games_played + 1,
        games_won = games_won + CASE WHEN p_is_win THEN 1 ELSE 0 END,
        updated_at = now()
    WHERE user_id = p_user_id
    RETURNING xp_total INTO v_current_xp;

    -- Basic level calculation: level 1 is 0-999, level 2 is 1000-2999, etc.
    -- (Level = floor(sqrt(xp / 100)) + 1)
    -- Just an example curve, adjusts level based on total XP
    v_new_level := GREATEST(1, floor(sqrt(v_current_xp / 100)) + 1);

    UPDATE public.forca_progresso
    SET level = v_new_level
    WHERE user_id = p_user_id AND level != v_new_level;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
