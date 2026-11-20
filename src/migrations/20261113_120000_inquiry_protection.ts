import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "inquiry_rate_limits" (
      "bucket_key" text PRIMARY KEY,
      "attempts" integer NOT NULL CHECK ("attempts" > 0),
      "expires_at" timestamptz NOT NULL
    );
    CREATE INDEX IF NOT EXISTS "inquiry_rate_limits_expiry_idx" ON "inquiry_rate_limits" ("expires_at");
    CREATE TABLE IF NOT EXISTS "inquiry_challenge_tokens" (
      "token_hash" text PRIMARY KEY,
      "expires_at" timestamptz NOT NULL
    );
    CREATE INDEX IF NOT EXISTS "inquiry_challenge_tokens_expiry_idx" ON "inquiry_challenge_tokens" ("expires_at");
    ALTER TABLE "inquiries" ADD COLUMN IF NOT EXISTS "intake_review_reason" text;
    ALTER TABLE "sponsor_inquiries" ADD COLUMN IF NOT EXISTS "intake_review_reason" text;
  `)
}

// Keep submitted records, review reasons, and recent abuse protection intact on
// application rollback. Expired protection rows can be deleted independently.
export async function down(_args: MigrateDownArgs): Promise<void> {}
