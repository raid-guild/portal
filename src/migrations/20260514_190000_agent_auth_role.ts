import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_users_roles" ADD VALUE IF NOT EXISTS 'agent';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DELETE FROM "users_roles" WHERE "value" = 'agent';
    ALTER TYPE "public"."enum_users_roles" RENAME TO "enum_users_roles_old";
    CREATE TYPE "public"."enum_users_roles" AS ENUM('admin', 'editor', 'contributor', 'member');
    ALTER TABLE "users_roles"
      ALTER COLUMN "value" TYPE "public"."enum_users_roles"
      USING "value"::text::"public"."enum_users_roles";
    DROP TYPE "public"."enum_users_roles_old";
  `)
}
