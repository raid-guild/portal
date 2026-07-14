import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_daily_engagements_vibe" ADD VALUE IF NOT EXISTS 'poopin';
  `)
}

export async function down({}: MigrateDownArgs): Promise<void> {
  // PostgreSQL enum values cannot be safely removed without rewriting dependent rows.
}
