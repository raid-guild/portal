import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "profiles" ADD COLUMN "contact_x" varchar;

    UPDATE "profiles"
    SET "contact_x" = NULLIF(
      regexp_replace(
        regexp_replace(
          regexp_replace("profiles_links"."url", '^https?://(www\\.)?(x|twitter)\\.com/', '', 'i'),
          '^@',
          ''
        ),
        '[/?#].*$',
        ''
      ),
      ''
    )
    FROM "profiles_links"
    WHERE "profiles"."id" = "profiles_links"."_parent_id"
      AND "profiles"."contact_x" IS NULL
      AND lower("profiles_links"."label") IN ('x', 'twitter')
      AND NULLIF("profiles_links"."url", '') IS NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "profiles" DROP COLUMN "contact_x";
  `)
}
