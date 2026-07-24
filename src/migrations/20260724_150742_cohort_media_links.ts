import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "cohorts_context_links" (
   "_order" integer NOT NULL,
   "_parent_id" integer NOT NULL,
   "id" varchar PRIMARY KEY NOT NULL,
   "title" varchar,
   "summary" varchar,
   "url" varchar
  );

  CREATE TABLE "_cohorts_v_version_context_links" (
   "_order" integer NOT NULL,
   "_parent_id" integer NOT NULL,
   "id" serial PRIMARY KEY NOT NULL,
   "title" varchar,
   "summary" varchar,
   "url" varchar,
   "_uuid" varchar
  );

  ALTER TABLE "cohorts" ADD COLUMN "exploration_video_u_r_l" varchar;
  ALTER TABLE "_cohorts_v" ADD COLUMN "version_exploration_video_u_r_l" varchar;
  ALTER TABLE "cohorts_context_links" ADD CONSTRAINT "cohorts_context_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cohorts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cohorts_v_version_context_links" ADD CONSTRAINT "_cohorts_v_version_context_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_cohorts_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "cohorts_context_links_order_idx" ON "cohorts_context_links" USING btree ("_order");
  CREATE INDEX "cohorts_context_links_parent_id_idx" ON "cohorts_context_links" USING btree ("_parent_id");
  CREATE INDEX "_cohorts_v_version_context_links_order_idx" ON "_cohorts_v_version_context_links" USING btree ("_order");
  CREATE INDEX "_cohorts_v_version_context_links_parent_id_idx" ON "_cohorts_v_version_context_links" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "cohorts_context_links" CASCADE;
  DROP TABLE "_cohorts_v_version_context_links" CASCADE;
  ALTER TABLE "cohorts" DROP COLUMN "exploration_video_u_r_l";
  ALTER TABLE "_cohorts_v" DROP COLUMN "version_exploration_video_u_r_l";`)
}
