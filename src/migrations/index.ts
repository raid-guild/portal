import * as migration_20241125_222020_initial from './20241125_222020_initial'
import * as migration_20241214_124128 from './20241214_124128'
import * as migration_20260222_003500_payload_3_77_compat from './20260222_003500_payload_3_77_compat'
import * as migration_20260505_122607_portal_profiles_projects from './20260505_122607_portal_profiles_projects'
import * as migration_20260505_130000_profile_role_icon_path from './20260505_130000_profile_role_icon_path'
import * as migration_20260505_141508_daily_briefs from './20260505_141508_daily_briefs'
import * as migration_20260505_155406_points_ledger from './20260505_155406_points_ledger'
import * as migration_20260511_200928_cohort_spike_primitives from './20260511_200928_cohort_spike_primitives'
import * as migration_20260512_141508_brief_media_and_weekly_type from './20260512_141508_brief_media_and_weekly_type'
import * as migration_20260512_144308_brief_external_media_url from './20260512_144308_brief_external_media_url'
import * as migration_20260514_153847_sponsor_inquiries from './20260514_153847_sponsor_inquiries'
import * as migration_20260514_190000_agent_auth_role from './20260514_190000_agent_auth_role'
import * as migration_20260515_214741_project_archive_curation_fields from './20260515_214741_project_archive_curation_fields'
import * as migration_20260516_120000_project_visibility from './20260516_120000_project_visibility'
import * as migration_20260516_130000_profile_claims from './20260516_130000_profile_claims'
import * as migration_20260518_120000_session_creation_fields from './20260518_120000_session_creation_fields'
import * as migration_20260519_120000_user_email_verification from './20260519_120000_user_email_verification'
import * as migration_20260520_120000_profile_contact_x from './20260520_120000_profile_contact_x'
import * as migration_20260521_120000_unverified_auth_role from './20260521_120000_unverified_auth_role'
import * as migration_20260522_120000_fireside_content_flow from './20260522_120000_fireside_content_flow'
import * as migration_20260526_120000_event_recurrence_fields from './20260526_120000_event_recurrence_fields'
import * as migration_20260526_130000_event_member_visibility from './20260526_130000_event_member_visibility'
import * as migration_20260528_120000_post_visibility from './20260528_120000_post_visibility'
import * as migration_20260528_200654_badges from './20260528_200654_badges'

export const migrations = [
  {
    up: migration_20241125_222020_initial.up,
    down: migration_20241125_222020_initial.down,
    name: '20241125_222020_initial',
  },
  {
    up: migration_20241214_124128.up,
    down: migration_20241214_124128.down,
    name: '20241214_124128',
  },
  {
    up: migration_20260222_003500_payload_3_77_compat.up,
    down: migration_20260222_003500_payload_3_77_compat.down,
    name: '20260222_003500_payload_3_77_compat',
  },
  {
    up: migration_20260505_122607_portal_profiles_projects.up,
    down: migration_20260505_122607_portal_profiles_projects.down,
    name: '20260505_122607_portal_profiles_projects',
  },
  {
    up: migration_20260505_130000_profile_role_icon_path.up,
    down: migration_20260505_130000_profile_role_icon_path.down,
    name: '20260505_130000_profile_role_icon_path',
  },
  {
    up: migration_20260505_141508_daily_briefs.up,
    down: migration_20260505_141508_daily_briefs.down,
    name: '20260505_141508_daily_briefs',
  },
  {
    up: migration_20260505_155406_points_ledger.up,
    down: migration_20260505_155406_points_ledger.down,
    name: '20260505_155406_points_ledger',
  },
  {
    up: migration_20260511_200928_cohort_spike_primitives.up,
    down: migration_20260511_200928_cohort_spike_primitives.down,
    name: '20260511_200928_cohort_spike_primitives',
  },
  {
    up: migration_20260512_141508_brief_media_and_weekly_type.up,
    down: migration_20260512_141508_brief_media_and_weekly_type.down,
    name: '20260512_141508_brief_media_and_weekly_type',
  },
  {
    up: migration_20260512_144308_brief_external_media_url.up,
    down: migration_20260512_144308_brief_external_media_url.down,
    name: '20260512_144308_brief_external_media_url',
  },
  {
    up: migration_20260514_153847_sponsor_inquiries.up,
    down: migration_20260514_153847_sponsor_inquiries.down,
    name: '20260514_153847_sponsor_inquiries',
  },
  {
    up: migration_20260514_190000_agent_auth_role.up,
    down: migration_20260514_190000_agent_auth_role.down,
    name: '20260514_190000_agent_auth_role',
  },
  {
    up: migration_20260515_214741_project_archive_curation_fields.up,
    down: migration_20260515_214741_project_archive_curation_fields.down,
    name: '20260515_214741_project_archive_curation_fields',
  },
  {
    up: migration_20260516_120000_project_visibility.up,
    down: migration_20260516_120000_project_visibility.down,
    name: '20260516_120000_project_visibility',
  },
  {
    up: migration_20260516_130000_profile_claims.up,
    down: migration_20260516_130000_profile_claims.down,
    name: '20260516_130000_profile_claims',
  },
  {
    up: migration_20260518_120000_session_creation_fields.up,
    down: migration_20260518_120000_session_creation_fields.down,
    name: '20260518_120000_session_creation_fields',
  },
  {
    up: migration_20260519_120000_user_email_verification.up,
    down: migration_20260519_120000_user_email_verification.down,
    name: '20260519_120000_user_email_verification',
  },
  {
    up: migration_20260520_120000_profile_contact_x.up,
    down: migration_20260520_120000_profile_contact_x.down,
    name: '20260520_120000_profile_contact_x',
  },
  {
    up: migration_20260521_120000_unverified_auth_role.up,
    down: migration_20260521_120000_unverified_auth_role.down,
    name: '20260521_120000_unverified_auth_role',
  },
  {
    up: migration_20260522_120000_fireside_content_flow.up,
    down: migration_20260522_120000_fireside_content_flow.down,
    name: '20260522_120000_fireside_content_flow',
  },
  {
    up: migration_20260526_120000_event_recurrence_fields.up,
    down: migration_20260526_120000_event_recurrence_fields.down,
    name: '20260526_120000_event_recurrence_fields',
  },
  {
    up: migration_20260526_130000_event_member_visibility.up,
    down: migration_20260526_130000_event_member_visibility.down,
    name: '20260526_130000_event_member_visibility',
  },
  {
    up: migration_20260528_120000_post_visibility.up,
    down: migration_20260528_120000_post_visibility.down,
    name: '20260528_120000_post_visibility',
  },
  {
    up: migration_20260528_200654_badges.up,
    down: migration_20260528_200654_badges.down,
    name: '20260528_200654_badges',
  },
]
