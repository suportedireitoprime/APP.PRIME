CREATE TABLE public.user_sync_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  escopo text NOT NULL,
  item_key text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  deleted boolean NOT NULL DEFAULT false,
  item_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, escopo, item_key)
);

CREATE INDEX idx_user_sync_items_user_escopo ON public.user_sync_items (user_id, escopo, updated_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_sync_items TO authenticated;
GRANT ALL ON public.user_sync_items TO service_role;

ALTER TABLE public.user_sync_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own sync items"
ON public.user_sync_items FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_user_sync_items_updated_at
BEFORE UPDATE ON public.user_sync_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();