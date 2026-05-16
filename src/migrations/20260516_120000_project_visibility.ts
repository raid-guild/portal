import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_projects_visibility" AS ENUM('public', 'authenticated', 'member', 'admin');
    CREATE TYPE "public"."enum__projects_v_version_visibility" AS ENUM('public', 'authenticated', 'member', 'admin');
    ALTER TABLE "projects" ADD COLUMN "visibility" "enum_projects_visibility" DEFAULT 'public';
    ALTER TABLE "_projects_v" ADD COLUMN "version_visibility" "enum__projects_v_version_visibility" DEFAULT 'public';
    CREATE INDEX "projects_visibility_idx" ON "projects" USING btree ("visibility");
    CREATE INDEX "_projects_v_version_version_visibility_idx" ON "_projects_v" USING btree ("version_visibility");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX "_projects_v_version_version_visibility_idx";
    DROP INDEX "projects_visibility_idx";
    ALTER TABLE "_projects_v" DROP COLUMN "version_visibility";
    ALTER TABLE "projects" DROP COLUMN "visibility";
    DROP TYPE "public"."enum__projects_v_version_visibility";
    DROP TYPE "public"."enum_projects_visibility";
  `)
}
