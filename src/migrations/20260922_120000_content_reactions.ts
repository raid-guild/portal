import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_content_reactions_kind" AS ENUM('like', 'bookmark');
    CREATE TYPE "public"."enum_content_reactions_actor_type" AS ENUM('member', 'anonymous');
    CREATE TYPE "public"."enum_content_reactions_target_collection" AS ENUM('posts', 'events', 'projects', 'threads', 'wikiPages');

    CREATE TABLE "content_reactions" (
      "id" serial PRIMARY KEY NOT NULL,
      "kind" "enum_content_reactions_kind" NOT NULL,
      "actor_type" "enum_content_reactions_actor_type" NOT NULL,
      "user_id" integer,
      "profile_id" integer,
      "anonymous_id" varchar,
      "target_collection" "enum_content_reactions_target_collection" NOT NULL,
      "target_id" integer NOT NULL,
      "ip_hash" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "content_reactions_id" integer;

    ALTER TABLE "content_reactions" ADD CONSTRAINT "content_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "content_reactions" ADD CONSTRAINT "content_reactions_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_content_reactions_fk" FOREIGN KEY ("content_reactions_id") REFERENCES "public"."content_reactions"("id") ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "content_reactions_kind_idx" ON "content_reactions" USING btree ("kind");
    CREATE INDEX "content_reactions_actor_type_idx" ON "content_reactions" USING btree ("actor_type");
    CREATE INDEX "content_reactions_user_idx" ON "content_reactions" USING btree ("user_id");
    CREATE INDEX "content_reactions_profile_idx" ON "content_reactions" USING btree ("profile_id");
    CREATE INDEX "content_reactions_anonymous_id_idx" ON "content_reactions" USING btree ("anonymous_id");
    CREATE INDEX "content_reactions_target_collection_target_id_idx" ON "content_reactions" USING btree ("target_collection", "target_id");
    CREATE INDEX "content_reactions_updated_at_idx" ON "content_reactions" USING btree ("updated_at");
    CREATE INDEX "content_reactions_created_at_idx" ON "content_reactions" USING btree ("created_at");
    CREATE INDEX "payload_locked_documents_rels_content_reactions_id_idx" ON "payload_locked_documents_rels" USING btree ("content_reactions_id");

    -- Postgres treats NULL as distinct in a unique index, so a single 4-column unique
    -- index can't dedupe both actor kinds at once. Two partial unique indexes instead:
    -- one for member rows (user_id set), one for anonymous rows (user_id null).
    CREATE UNIQUE INDEX "content_reactions_member_unique_idx" ON "content_reactions" USING btree ("user_id", "kind", "target_collection", "target_id") WHERE "user_id" IS NOT NULL;
    CREATE UNIQUE INDEX "content_reactions_anon_unique_idx" ON "content_reactions" USING btree ("anonymous_id", "kind", "target_collection", "target_id") WHERE "user_id" IS NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "content_reactions" DISABLE ROW LEVEL SECURITY;

    DROP INDEX IF EXISTS "content_reactions_anon_unique_idx";
    DROP INDEX IF EXISTS "content_reactions_member_unique_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_content_reactions_id_idx";
    DROP INDEX IF EXISTS "content_reactions_created_at_idx";
    DROP INDEX IF EXISTS "content_reactions_updated_at_idx";
    DROP INDEX IF EXISTS "content_reactions_target_collection_target_id_idx";
    DROP INDEX IF EXISTS "content_reactions_anonymous_id_idx";
    DROP INDEX IF EXISTS "content_reactions_profile_idx";
    DROP INDEX IF EXISTS "content_reactions_user_idx";
    DROP INDEX IF EXISTS "content_reactions_actor_type_idx";
    DROP INDEX IF EXISTS "content_reactions_kind_idx";

    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_content_reactions_fk";
    ALTER TABLE "content_reactions" DROP CONSTRAINT IF EXISTS "content_reactions_profile_id_profiles_id_fk";
    ALTER TABLE "content_reactions" DROP CONSTRAINT IF EXISTS "content_reactions_user_id_users_id_fk";

    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "content_reactions_id";
    DROP TABLE IF EXISTS "content_reactions";

    DROP TYPE IF EXISTS "public"."enum_content_reactions_target_collection";
    DROP TYPE IF EXISTS "public"."enum_content_reactions_actor_type";
    DROP TYPE IF EXISTS "public"."enum_content_reactions_kind";
  `)
}
