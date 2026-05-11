import * as migration_20241125_222020_initial from './20241125_222020_initial';
import * as migration_20241214_124128 from './20241214_124128';
import * as migration_20260222_003500_payload_3_77_compat from './20260222_003500_payload_3_77_compat';
import * as migration_20260505_122607_portal_profiles_projects from './20260505_122607_portal_profiles_projects';
import * as migration_20260505_130000_profile_role_icon_path from './20260505_130000_profile_role_icon_path';
import * as migration_20260505_141508_daily_briefs from './20260505_141508_daily_briefs';
import * as migration_20260505_155406_points_ledger from './20260505_155406_points_ledger';
import * as migration_20260511_200928_cohort_spike_primitives from './20260511_200928_cohort_spike_primitives';

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
    name: '20260511_200928_cohort_spike_primitives'
  },
];
