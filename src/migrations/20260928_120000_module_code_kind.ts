import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`ALTER TYPE "public"."enum_modules_module_kind" ADD VALUE IF NOT EXISTS 'code';`)
}

// PostgreSQL cannot drop one enum value safely while records may reference it.
export async function down(_args: MigrateDownArgs): Promise<void> {}
