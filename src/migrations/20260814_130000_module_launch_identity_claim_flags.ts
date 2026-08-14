import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "modules" ADD COLUMN IF NOT EXISTS "include_wallets_in_launch" boolean DEFAULT false;
    ALTER TABLE "modules" ADD COLUMN IF NOT EXISTS "include_credentials_in_launch" boolean DEFAULT false;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "modules" DROP COLUMN IF EXISTS "include_credentials_in_launch";
    ALTER TABLE "modules" DROP COLUMN IF EXISTS "include_wallets_in_launch";
  `)
}
