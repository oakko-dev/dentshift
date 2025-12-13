-- CreateTable
CREATE TABLE "banks" (
    "id" BIGSERIAL NOT NULL,
    "account_name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,

    CONSTRAINT "banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "healthcheck" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR,
    "count" BIGINT,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "healthcheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "places" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR NOT NULL,
    "branch" VARCHAR NOT NULL,
    "location" TEXT,
    "tag" TEXT,
    "start_time" TIME(6) NOT NULL,
    "end_time" TIME(6) NOT NULL,
    "tax_type" VARCHAR,
    "remark" TEXT,

    CONSTRAINT "places_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "place_id" BIGINT NOT NULL,
    "appointment_date" DATE NOT NULL,
    "df_guarantee_amount" DECIMAL NOT NULL,
    "df_percent" DECIMAL NOT NULL,
    "remark" TEXT,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "works" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schedule_id" BIGINT NOT NULL,
    "total_amount" DECIMAL NOT NULL,
    "df_amount" DECIMAL NOT NULL,
    "bank_id" BIGINT,
    "forecast_payment_date" DATE NOT NULL,
    "remark" TEXT,
    "deposit_date" DATE,
    "deposit_amount" DECIMAL,

    CONSTRAINT "works_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "works" ADD CONSTRAINT "works_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "works" ADD CONSTRAINT "works_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
