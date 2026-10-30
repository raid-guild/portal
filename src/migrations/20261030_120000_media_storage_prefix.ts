import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Keep this additive: the same database serves the old volume-backed app.
  await db.execute(sql`
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "prefix" varchar DEFAULT 'portal/media';
    UPDATE "media" SET "prefix" = 'portal/media' WHERE "prefix" IS NULL OR "prefix" = '';
  `)
  const unexpected = await db.execute(sql`
    SELECT COUNT(*)::int AS count FROM "media" WHERE "prefix" <> 'portal/media';
  `)
  if (Number(unexpected.rows[0]?.count || 0) > 0) {
    throw new Error('Media records with unexpected storage prefixes exist; inspect them before enabling S3')
  }
}

// Storage keys must never be removed automatically during a rollback.
export async function down(_args: MigrateDownArgs): Promise<void> {}
