import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "daily_briefs" ADD COLUMN "external_media_u_r_l" varchar;
  ALTER TABLE "_daily_briefs_v" ADD COLUMN "version_external_media_u_r_l" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "daily_briefs" DROP COLUMN "external_media_u_r_l";
  ALTER TABLE "_daily_briefs_v" DROP COLUMN "version_external_media_u_r_l";`)
}
