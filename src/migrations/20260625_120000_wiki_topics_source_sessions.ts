import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "wiki_topics_rels" ADD COLUMN IF NOT EXISTS "events_id" integer;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'wiki_topics_rels_events_fk'
      ) THEN
        ALTER TABLE "wiki_topics_rels"
          ADD CONSTRAINT "wiki_topics_rels_events_fk"
          FOREIGN KEY ("events_id")
          REFERENCES "public"."events"("id")
          ON DELETE cascade
          ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "wiki_topics_rels_events_id_idx"
      ON "wiki_topics_rels" USING btree ("events_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "wiki_topics_rels_events_id_idx";
    ALTER TABLE "wiki_topics_rels" DROP CONSTRAINT IF EXISTS "wiki_topics_rels_events_fk";
    ALTER TABLE "wiki_topics_rels" DROP COLUMN IF EXISTS "events_id";
  `)
}
