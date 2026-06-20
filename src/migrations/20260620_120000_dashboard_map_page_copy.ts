import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_page_copy_surface" ADD VALUE IF NOT EXISTS 'dashboard';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "page_copy" SET "surface" = 'other' WHERE "surface" = 'dashboard';
  `)
}

