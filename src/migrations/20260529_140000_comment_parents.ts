import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE "comments_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "posts_id" integer,
      "events_id" integer,
      "projects_id" integer,
      "contribution_requests_id" integer
    );

    ALTER TABLE "comments" ALTER COLUMN "post_id" DROP NOT NULL;

    INSERT INTO "comments_rels" ("parent_id", "path", "posts_id")
    SELECT "id", 'parent', "post_id"
    FROM "comments"
    WHERE "post_id" IS NOT NULL;

    ALTER TABLE "comments_rels" ADD CONSTRAINT "comments_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "comments_rels" ADD CONSTRAINT "comments_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "comments_rels" ADD CONSTRAINT "comments_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "comments_rels" ADD CONSTRAINT "comments_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "comments_rels" ADD CONSTRAINT "comments_rels_contribution_requests_fk" FOREIGN KEY ("contribution_requests_id") REFERENCES "public"."contribution_requests"("id") ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "comments_rels_order_idx" ON "comments_rels" USING btree ("order");
    CREATE INDEX "comments_rels_parent_idx" ON "comments_rels" USING btree ("parent_id");
    CREATE INDEX "comments_rels_path_idx" ON "comments_rels" USING btree ("path");
    CREATE INDEX "comments_rels_posts_id_idx" ON "comments_rels" USING btree ("posts_id");
    CREATE INDEX "comments_rels_events_id_idx" ON "comments_rels" USING btree ("events_id");
    CREATE INDEX "comments_rels_projects_id_idx" ON "comments_rels" USING btree ("projects_id");
    CREATE INDEX "comments_rels_contribution_requests_id_idx" ON "comments_rels" USING btree ("contribution_requests_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "comments"
    SET "post_id" = "comments_rels"."posts_id"
    FROM "comments_rels"
    WHERE "comments"."id" = "comments_rels"."parent_id"
      AND "comments_rels"."path" = 'parent'
      AND "comments_rels"."posts_id" IS NOT NULL;

    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM "comments" WHERE "post_id" IS NULL) THEN
        RAISE EXCEPTION 'Cannot roll back comment parent migration while non-post comments exist.';
      END IF;
    END $$;

    ALTER TABLE "comments" ALTER COLUMN "post_id" SET NOT NULL;

    DROP INDEX IF EXISTS "comments_rels_contribution_requests_id_idx";
    DROP INDEX IF EXISTS "comments_rels_projects_id_idx";
    DROP INDEX IF EXISTS "comments_rels_events_id_idx";
    DROP INDEX IF EXISTS "comments_rels_posts_id_idx";
    DROP INDEX IF EXISTS "comments_rels_path_idx";
    DROP INDEX IF EXISTS "comments_rels_parent_idx";
    DROP INDEX IF EXISTS "comments_rels_order_idx";

    ALTER TABLE "comments_rels" DROP CONSTRAINT IF EXISTS "comments_rels_contribution_requests_fk";
    ALTER TABLE "comments_rels" DROP CONSTRAINT IF EXISTS "comments_rels_projects_fk";
    ALTER TABLE "comments_rels" DROP CONSTRAINT IF EXISTS "comments_rels_events_fk";
    ALTER TABLE "comments_rels" DROP CONSTRAINT IF EXISTS "comments_rels_posts_fk";
    ALTER TABLE "comments_rels" DROP CONSTRAINT IF EXISTS "comments_rels_parent_fk";

    DROP TABLE IF EXISTS "comments_rels";
  `)
}
