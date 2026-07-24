import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "cohort_commitments"
      DROP CONSTRAINT "cohort_commitments_cohort_id_cohorts_id_fk",
      ADD CONSTRAINT "cohort_commitments_cohort_id_cohorts_id_fk"
        FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id")
        ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "cohort_commitments"
      DROP CONSTRAINT "cohort_commitments_profile_id_profiles_id_fk",
      ADD CONSTRAINT "cohort_commitments_profile_id_profiles_id_fk"
        FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id")
        ON DELETE cascade ON UPDATE no action;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "cohort_commitments"
      DROP CONSTRAINT "cohort_commitments_cohort_id_cohorts_id_fk",
      ADD CONSTRAINT "cohort_commitments_cohort_id_cohorts_id_fk"
        FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id")
        ON DELETE set null ON UPDATE no action;

    ALTER TABLE "cohort_commitments"
      DROP CONSTRAINT "cohort_commitments_profile_id_profiles_id_fk",
      ADD CONSTRAINT "cohort_commitments_profile_id_profiles_id_fk"
        FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id")
        ON DELETE set null ON UPDATE no action;
  `)
}
