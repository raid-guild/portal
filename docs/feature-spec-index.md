# Feature Spec Index

This index organizes Portal specs by product area and implementation status.
Use it as the starting point for planning, handoff, and collaborator review.

Status labels:

- `Active MVP`: core work currently shaping the launch surface.
- `First slice implemented`: useful code exists, but the spec still contains
  future work and open questions.
- `Planned / future`: documented direction with no primary implementation yet.
- `Separate product direction`: useful strategy, but not current app work.

## Active MVP

| Area | Spec | Status | Notes |
| --- | --- | --- | --- |
| Cohort portal | [Cohort project spike MVP](./cohort-spike-mvp-spec.md) | Active MVP | Product frame for the current app. |
| Sessions | [Sessions MVP](./sessions-mvp-spec.md) | Active MVP | Main live coordination surface; collection slug remains `events`. |

## Implemented First Slices

| Area | Spec | Status | Notes |
| --- | --- | --- | --- |
| Contribution requests | [Contribution requests](./contribution-requests-feature-spec.md) | First slice implemented | Request records, detail/create/edit UI, project/session display. |
| Notifications | [Notifications](./notifications-feature-spec.md) | First slice implemented | Inbox, preferences, publish hooks, reminders, digests, email dispatcher. |
| Recognition | [Badges and props](./badges-and-props-feature-spec.md) | First badge slice implemented | `badges` and `profileBadges` exist; props remain future. |
| Points and check-ins | [Points and daily engagement](./points-and-daily-engagement-feature-spec.md) | First slice implemented | Daily vibe check and point events exist; richer scoring remains future. |
| Modules | [Portal modules](./modules-feature-spec.md) | First slice implemented | Module registry, `/modules`, and seeded Portal Graph module exist. |
| Portal Graph | [Portal Graph](./portal-graph-feature-spec.md) | First slice implemented | Authenticated skill/role/profile graph exists as a module. |
| Onboarding and inquiries | [Onboarding and inquiry funnel](./onboarding-funnel-feature-spec.md) | First slice implemented | `/join`, `/inquire/[type]`, and `inquiries` exist; copy needs BD polish. |
| CMS page copy | [CMS-managed page copy](./cms-managed-page-copy-feature-spec.md) | First slice implemented | `PageCopy` supports fixed product-flow pages. |
| Widget bubble | [Widget Bubble](./widget-bubble-feature-spec.md) | First slice implemented | Feedback route, `feedbackSubmissions`, and default-on widget exist. |
| Brief spotlight | [Brief spotlight](./brief-spotlight-feature-spec.md) | First slice implemented | `spotlights`, active home/dashboard cards, and thread detail pages exist. |
| Interactive map dashboard | [Interactive map dashboard](./map-dashboard-feature-spec.md) | First slice implemented | Alternate authenticated dashboard landing view using existing Portal primitives. |
| RaidGuild cohort hub | [RaidGuild cohort hub](./raidguild-cohort-hub-feature-spec.md) | First slice implemented | Reusable cohort hubs, Profile-gated commitments, Event-backed schedules, dashboard discovery, and durable routes exist. |

## Planned / Future Modules

| Area | Spec | Status | Notes |
| --- | --- | --- | --- |
| Launch invites | [Launch invites](./launch-invites-feature-spec.md) | Planned / future | Keep bulk launch email outside Payload for now. |
| Newsletter module | [Newsletter module](./newsletter-module-feature-spec.md) | Planned / first slice | Portal-side bridge from posts to listmonk campaign drafts and test sends. |
| Fireside content flow | [Fireside content flow](./fireside-content-flow-feature-spec.md) | Planned / future | Use sessions as source records before adding new collections. |
| External CRM | [External CRM module and Portal identity](./external-crm-module-identity-spec.md) | Planned / future | Portal remains profile/role authority; CRM is an external module with future launch-token SSO. |
| Infinite Wiki | [Infinite Wiki](./infinite-wiki-feature-spec.md) and [Graph Discovery](./infinite-wiki-graph-discovery-spec.md) | First slice implemented | `wikiPages`, module entry, and public wiki routes exist; topic graph discovery and Prism generation are planned next. |
| External module launch auth | [External module launch auth](./external-module-launch-auth-feature-spec.md) | Planned / future | Signed launch handoff for external apps while Portal remains identity/profile source of truth. |
| Themeability refactor | [Themeability refactor](./themeability-refactor-spec.md), [theme authoring guide](./theme-authoring-guide.md) | First slice implemented | Semantic dark/light theme contract, reusable component tokens, runtime graph colors, and an art-directed map token boundary. |

## Separate Product Direction

| Area | Spec | Status | Notes |
| --- | --- | --- | --- |
| Generic template | [Generic community portal template](./generic-community-portal-template-spec.md) | Separate product direction | Belongs in a separate repo once Portal primitives stabilize. |

## Reference Docs

- [Product overview](./portal-product-overview.md)
- [Portal direction](./portal-direction.md)
- [Roles and capabilities](./roles-and-capabilities.md)
- [Contributor guidelines](./contributor-guidelines.md)
- [Implementation checklist](./portal-implementation-checklist.md)
- [External module integration guide](./external-module-integration-guide.md)
- [Prism / Portal memory handoff](./prism-portal-memory-handoff.md)
- [Portal launch announcement draft](./portal-launch-announcement-draft.md)

## Maintenance Notes

- When a feature moves from planned to implemented, update this index and the
  spec's `Status` section in the same PR.
- Keep specs explicit about what exists now versus what is deferred.
- Avoid adding a new collection to a spec unless the feature needs independent
  lifecycle, permissions, admin management, filtering/search, or future API use.
