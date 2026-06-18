import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_signup_attempts_outcome" AS ENUM('allowed', 'blocked');
    CREATE TYPE "public"."enum_signup_attempts_reason" AS ENUM('allowed', 'honeypot', 'too_fast', 'missing_proof', 'rate_limited', 'blocked_domain');

    CREATE TABLE "signup_attempts" (
      "id" serial PRIMARY KEY NOT NULL,
      "email_hash" varchar NOT NULL,
      "email_domain" varchar NOT NULL,
      "ip_hash" varchar NOT NULL,
      "outcome" "enum_signup_attempts_outcome" DEFAULT 'allowed' NOT NULL,
      "reason" "enum_signup_attempts_reason" DEFAULT 'allowed' NOT NULL,
      "user_agent" varchar,
      "metadata" jsonb,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "signup_attempts_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_signup_attempts_fk" FOREIGN KEY ("signup_attempts_id") REFERENCES "public"."signup_attempts"("id") ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "signup_attempts_email_hash_idx" ON "signup_attempts" USING btree ("email_hash");
    CREATE INDEX "signup_attempts_email_domain_idx" ON "signup_attempts" USING btree ("email_domain");
    CREATE INDEX "signup_attempts_ip_hash_idx" ON "signup_attempts" USING btree ("ip_hash");
    CREATE INDEX "signup_attempts_outcome_idx" ON "signup_attempts" USING btree ("outcome");
    CREATE INDEX "signup_attempts_reason_idx" ON "signup_attempts" USING btree ("reason");
    CREATE INDEX "signup_attempts_updated_at_idx" ON "signup_attempts" USING btree ("updated_at");
    CREATE INDEX "signup_attempts_created_at_idx" ON "signup_attempts" USING btree ("created_at");
    CREATE INDEX "payload_locked_documents_rels_signup_attempts_id_idx" ON "payload_locked_documents_rels" USING btree ("signup_attempts_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE IF EXISTS "signup_attempts" DISABLE ROW LEVEL SECURITY;

    DROP INDEX IF EXISTS "payload_locked_documents_rels_signup_attempts_id_idx";
    DROP INDEX IF EXISTS "signup_attempts_created_at_idx";
    DROP INDEX IF EXISTS "signup_attempts_updated_at_idx";
    DROP INDEX IF EXISTS "signup_attempts_reason_idx";
    DROP INDEX IF EXISTS "signup_attempts_outcome_idx";
    DROP INDEX IF EXISTS "signup_attempts_ip_hash_idx";
    DROP INDEX IF EXISTS "signup_attempts_email_domain_idx";
    DROP INDEX IF EXISTS "signup_attempts_email_hash_idx";

    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_signup_attempts_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "signup_attempts_id";
    DROP TABLE IF EXISTS "signup_attempts";

    DROP TYPE IF EXISTS "public"."enum_signup_attempts_reason";
    DROP TYPE IF EXISTS "public"."enum_signup_attempts_outcome";
  `)
}
