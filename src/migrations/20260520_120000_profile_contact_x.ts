import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "profiles" ADD COLUMN "contact_x" varchar;

    WITH chosen_links AS (
      SELECT DISTINCT ON ("_parent_id")
        "_parent_id",
        "url"
      FROM "profiles_links"
      WHERE lower("label") IN ('x', 'twitter')
        AND NULLIF("url", '') IS NOT NULL
      ORDER BY "_parent_id", "_order" ASC, "id" ASC
    )
    UPDATE "profiles"
    SET "contact_x" = NULLIF(
      regexp_replace(
        regexp_replace(
          regexp_replace(chosen_links."url", '^https?://(www\\.)?(x|twitter)\\.com/', '', 'i'),
          '^@',
          ''
        ),
        '[/?#].*$',
        ''
      ),
      ''
    )
    FROM chosen_links
    WHERE "profiles"."id" = chosen_links."_parent_id"
      AND "profiles"."contact_x" IS NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "profiles" DROP COLUMN "contact_x";
  `)
}
