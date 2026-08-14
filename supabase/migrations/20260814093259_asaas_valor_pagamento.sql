ALTER TABLE public.legacy_subscribers
ADD COLUMN asaas_value numeric(10,2),
ADD COLUMN asaas_billing_type text;
