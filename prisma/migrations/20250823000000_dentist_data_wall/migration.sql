-- Dentist data wall: owner columns, backfill, RLS, app role

-- Add owner columns (nullable until backfill)
ALTER TABLE "banks" ADD COLUMN "user_id" UUID;
ALTER TABLE "works" ADD COLUMN "user_id" UUID;

-- Backfill to Parinda (daparindada@gmail.com)
DO $$
DECLARE
  parinda_id UUID;
BEGIN
  SELECT id INTO parinda_id FROM users WHERE email = 'daparindada@gmail.com';
  IF parinda_id IS NULL THEN
    RAISE EXCEPTION 'Migration requires user with email daparindada@gmail.com';
  END IF;

  UPDATE "banks" SET "user_id" = parinda_id WHERE "user_id" IS NULL;
  UPDATE "schedules" SET "user_id" = parinda_id WHERE "user_id" IS NULL;
  UPDATE "works" w
    SET "user_id" = s."user_id"
    FROM "schedules" s
    WHERE w."schedule_id" = s."id" AND w."user_id" IS NULL;
  UPDATE "works" SET "user_id" = parinda_id WHERE "user_id" IS NULL;
END $$;

-- Enforce NOT NULL
ALTER TABLE "banks" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "schedules" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "works" ALTER COLUMN "user_id" SET NOT NULL;

-- Per-dentist bank account uniqueness
CREATE UNIQUE INDEX "banks_user_id_account_number_key" ON "banks"("user_id", "account_number");

-- Foreign keys
ALTER TABLE "banks" ADD CONSTRAINT "banks_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "works" ADD CONSTRAINT "works_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- App role (no RLS bypass)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'dentshift_app') THEN
    CREATE ROLE dentshift_app NOINHERIT NOSUPERUSER NOBYPASSRLS;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO dentshift_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO dentshift_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO dentshift_app;
GRANT dentshift_app TO CURRENT_USER;

-- Row level security
ALTER TABLE "banks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "banks" FORCE ROW LEVEL SECURITY;
ALTER TABLE "schedules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "schedules" FORCE ROW LEVEL SECURITY;
ALTER TABLE "works" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "works" FORCE ROW LEVEL SECURITY;
ALTER TABLE "places" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "places" FORCE ROW LEVEL SECURITY;

-- banks
CREATE POLICY "banks_select" ON "banks" FOR SELECT
  USING ("user_id"::text = current_setting('app.current_user_id', true));

CREATE POLICY "banks_insert" ON "banks" FOR INSERT
  WITH CHECK ("user_id"::text = current_setting('app.current_user_id', true));

CREATE POLICY "banks_update" ON "banks" FOR UPDATE
  USING ("user_id"::text = current_setting('app.current_user_id', true))
  WITH CHECK ("user_id"::text = current_setting('app.current_user_id', true));

CREATE POLICY "banks_delete" ON "banks" FOR DELETE
  USING ("user_id"::text = current_setting('app.current_user_id', true));

-- schedules
CREATE POLICY "schedules_select" ON "schedules" FOR SELECT
  USING ("user_id"::text = current_setting('app.current_user_id', true));

CREATE POLICY "schedules_insert" ON "schedules" FOR INSERT
  WITH CHECK ("user_id"::text = current_setting('app.current_user_id', true));

CREATE POLICY "schedules_update" ON "schedules" FOR UPDATE
  USING ("user_id"::text = current_setting('app.current_user_id', true))
  WITH CHECK ("user_id"::text = current_setting('app.current_user_id', true));

CREATE POLICY "schedules_delete" ON "schedules" FOR DELETE
  USING ("user_id"::text = current_setting('app.current_user_id', true));

-- works
CREATE POLICY "works_select" ON "works" FOR SELECT
  USING ("user_id"::text = current_setting('app.current_user_id', true));

CREATE POLICY "works_insert" ON "works" FOR INSERT
  WITH CHECK ("user_id"::text = current_setting('app.current_user_id', true));

CREATE POLICY "works_update" ON "works" FOR UPDATE
  USING ("user_id"::text = current_setting('app.current_user_id', true))
  WITH CHECK ("user_id"::text = current_setting('app.current_user_id', true));

CREATE POLICY "works_delete" ON "works" FOR DELETE
  USING ("user_id"::text = current_setting('app.current_user_id', true));

-- places: shared catalog; delete only when no schedules reference the row (any owner)
CREATE OR REPLACE FUNCTION place_has_any_schedule(p_place_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM schedules WHERE place_id = p_place_id);
$$;

GRANT EXECUTE ON FUNCTION place_has_any_schedule(BIGINT) TO dentshift_app;

CREATE POLICY "places_select" ON "places" FOR SELECT
  USING (
    current_setting('app.current_user_id', true) IS NOT NULL
    AND current_setting('app.current_user_id', true) <> ''
  );

CREATE POLICY "places_insert" ON "places" FOR INSERT
  WITH CHECK (
    current_setting('app.current_user_id', true) IS NOT NULL
    AND current_setting('app.current_user_id', true) <> ''
  );

CREATE POLICY "places_update" ON "places" FOR UPDATE
  USING (
    current_setting('app.current_user_id', true) IS NOT NULL
    AND current_setting('app.current_user_id', true) <> ''
  )
  WITH CHECK (
    current_setting('app.current_user_id', true) IS NOT NULL
    AND current_setting('app.current_user_id', true) <> ''
  );

CREATE POLICY "places_delete" ON "places" FOR DELETE
  USING (
    current_setting('app.current_user_id', true) IS NOT NULL
    AND current_setting('app.current_user_id', true) <> ''
    AND NOT place_has_any_schedule("places"."id")
  );
