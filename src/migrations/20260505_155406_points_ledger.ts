import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_point_events_source" AS ENUM('admin', 'system', 'quest', 'bounty', 'import');
  CREATE TYPE "public"."enum_point_events_status" AS ENUM('valid', 'reversed');
  CREATE TABLE "point_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"recipient_id" integer,
  	"amount" numeric NOT NULL,
  	"reason" varchar NOT NULL,
  	"description" varchar,
  	"source" "enum_point_events_source" DEFAULT 'admin' NOT NULL,
  	"status" "enum_point_events_status" DEFAULT 'valid' NOT NULL,
  	"issued_by_id" integer,
  	"issued_at" timestamp(3) with time zone NOT NULL,
  	"related_project_id" integer,
  	"related_post_id" integer,
  	"related_daily_brief_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "point_events_id" integer;
  ALTER TABLE "point_events" ADD CONSTRAINT "point_events_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "point_events" ADD CONSTRAINT "point_events_issued_by_id_users_id_fk" FOREIGN KEY ("issued_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "point_events" ADD CONSTRAINT "point_events_related_project_id_projects_id_fk" FOREIGN KEY ("related_project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "point_events" ADD CONSTRAINT "point_events_related_post_id_posts_id_fk" FOREIGN KEY ("related_post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "point_events" ADD CONSTRAINT "point_events_related_daily_brief_id_daily_briefs_id_fk" FOREIGN KEY ("related_daily_brief_id") REFERENCES "public"."daily_briefs"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "point_events_recipient_idx" ON "point_events" USING btree ("recipient_id");
  CREATE INDEX "point_events_issued_by_idx" ON "point_events" USING btree ("issued_by_id");
  CREATE INDEX "point_events_related_project_idx" ON "point_events" USING btree ("related_project_id");
  CREATE INDEX "point_events_related_post_idx" ON "point_events" USING btree ("related_post_id");
  CREATE INDEX "point_events_related_daily_brief_idx" ON "point_events" USING btree ("related_daily_brief_id");
  CREATE INDEX "point_events_updated_at_idx" ON "point_events" USING btree ("updated_at");
  CREATE INDEX "point_events_created_at_idx" ON "point_events" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_point_events_fk" FOREIGN KEY ("point_events_id") REFERENCES "public"."point_events"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_point_events_id_idx" ON "payload_locked_documents_rels" USING btree ("point_events_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "point_events" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_point_events_fk";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_point_events_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "point_events_id";
  DROP TABLE "point_events" CASCADE;
  DROP TYPE "public"."enum_point_events_source";
  DROP TYPE "public"."enum_point_events_status";`)
}
