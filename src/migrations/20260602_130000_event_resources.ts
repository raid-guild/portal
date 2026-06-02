import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_events_resources_resource_type" AS ENUM('link', 'notes', 'slides', 'doc', 'repo', 'design', 'artifact', 'other');
    CREATE TYPE "public"."enum__events_v_version_resources_resource_type" AS ENUM('link', 'notes', 'slides', 'doc', 'repo', 'design', 'artifact', 'other');

    CREATE TABLE "events_resources" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar,
      "url" varchar,
      "resource_type" "public"."enum_events_resources_resource_type" DEFAULT 'link'
    );

    CREATE TABLE "_events_v_version_resources" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "label" varchar,
      "url" varchar,
      "resource_type" "public"."enum__events_v_version_resources_resource_type" DEFAULT 'link',
      "_uuid" varchar
    );

    ALTER TABLE "events_resources" ADD CONSTRAINT "events_resources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_events_v_version_resources" ADD CONSTRAINT "_events_v_version_resources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v"("id") ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "events_resources_order_idx" ON "events_resources" USING btree ("_order");
    CREATE INDEX "events_resources_parent_id_idx" ON "events_resources" USING btree ("_parent_id");
    CREATE INDEX "_events_v_version_resources_order_idx" ON "_events_v_version_resources" USING btree ("_order");
    CREATE INDEX "_events_v_version_resources_parent_id_idx" ON "_events_v_version_resources" USING btree ("_parent_id");

    ALTER TABLE "events_resources" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "_events_v_version_resources" DISABLE ROW LEVEL SECURITY;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "_events_v_version_resources_parent_id_idx";
    DROP INDEX IF EXISTS "_events_v_version_resources_order_idx";
    DROP INDEX IF EXISTS "events_resources_parent_id_idx";
    DROP INDEX IF EXISTS "events_resources_order_idx";

    ALTER TABLE "_events_v_version_resources" DROP CONSTRAINT IF EXISTS "_events_v_version_resources_parent_id_fk";
    ALTER TABLE "events_resources" DROP CONSTRAINT IF EXISTS "events_resources_parent_id_fk";

    DROP TABLE IF EXISTS "_events_v_version_resources" CASCADE;
    DROP TABLE IF EXISTS "events_resources" CASCADE;

    DROP TYPE IF EXISTS "public"."enum__events_v_version_resources_resource_type";
    DROP TYPE IF EXISTS "public"."enum_events_resources_resource_type";
  `)
}
