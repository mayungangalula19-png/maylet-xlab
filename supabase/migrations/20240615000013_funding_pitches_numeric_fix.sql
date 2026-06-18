-- Widen funding_pitches numeric columns (fixes "numeric field overflow" for amounts like 50000)

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'funding_pitches' AND column_name = 'amount'
  ) THEN
    ALTER TABLE public.funding_pitches
      ALTER COLUMN amount TYPE NUMERIC(14, 2) USING amount::numeric;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'funding_pitches' AND column_name = 'amount_sought'
  ) THEN
    ALTER TABLE public.funding_pitches
      ALTER COLUMN amount_sought TYPE NUMERIC(14, 2) USING amount_sought::numeric;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'funding_pitches' AND column_name = 'equity_offered'
  ) THEN
    ALTER TABLE public.funding_pitches
      ALTER COLUMN equity_offered TYPE NUMERIC(6, 2) USING equity_offered::numeric;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
