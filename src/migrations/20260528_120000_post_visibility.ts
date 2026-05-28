import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_posts_visibility" AS ENUM('public', 'authenticated', 'member', 'admin');
    CREATE TYPE "public"."enum__posts_v_version_visibility" AS ENUM('public', 'authenticated', 'member', 'admin');
    ALTER TABLE "posts" ADD COLUMN "visibility" "enum_posts_visibility" DEFAULT 'public' NOT NULL;
    ALTER TABLE "_posts_v" ADD COLUMN "version_visibility" "enum__posts_v_version_visibility" DEFAULT 'public';
    CREATE INDEX "posts_visibility_idx" ON "posts" USING btree ("visibility");
    CREATE INDEX "_posts_v_version_version_visibility_idx" ON "_posts_v" USING btree ("version_visibility");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "_posts_v_version_version_visibility_idx";
    DROP INDEX IF EXISTS "posts_visibility_idx";
    ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "version_visibility";
    ALTER TABLE "posts" DROP COLUMN IF EXISTS "visibility";
    DROP TYPE IF EXISTS "public"."enum__posts_v_version_visibility";
    DROP TYPE IF EXISTS "public"."enum_posts_visibility";
  `)
}
