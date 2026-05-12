# AGENTS.md

This file defines the working rules for automated agents in this repository.

## Core Principles

- Prefer maintainable fixes over shortcuts.
- Do not use broad or heavy dependency overrides as a primary solution.
- Keep the project on properly updated direct dependencies whenever possible.
- Treat end-to-end verification as mandatory for meaningful changes.

## Dependency Rules

- Use `pnpm` for package management.
- Prefer updating direct dependencies in `package.json` over forcing transitive versions with `pnpm.overrides`.
- Only use `pnpm.overrides` as a last resort when there is no reasonable upstream or direct-dependency fix.
- If an override is truly unavoidable, keep it narrowly scoped, document why, and remove it as soon as upstream allows.
- When updating Payload packages, keep the Payload package family aligned on the same version.
- When updating `payload`, also update the documented version in `README.md` in the `Version Info` section during the same change.
- Do not leave misleading version notes in the README. Documentation must match the actual dependency state.

## Branching And Release Rules

- Never push directly to `master`.
- Push agent work to `staging` only.
- A human is responsible for merging to `master`.
- If asked to publish work, prefer `staging` unless the human explicitly instructs otherwise.
- Do not rewrite `master` history.

## Testing Rules

- Run relevant tests after changes.
- For changes that affect app behavior, dependency upgrades, build tooling, auth, admin flows, seeding, comments, routing, or rendering, run the Playwright end-to-end suite.
- Use `corepack pnpm test:e2e` as the default verification command for those changes.
- If the task affects the visible browser flow and manual inspection is useful, use `corepack pnpm test:e2e:headed` or `corepack pnpm test:e2e:manual`.
- Do not claim success without stating what was actually run.

## E2E And App Workflow Rules

- Keep the Docker-based PostgreSQL flow working for e2e tests.
- Do not break the admin onboarding flow.
- Preserve the seeded-content workflow and the comment approval flow unless the task explicitly changes them.
- Seed behavior for e2e must stay deterministic.
- Production seeding must not be silently changed to test-only behavior.

## Audit And Security Rules

- When addressing audit warnings, first try proper dependency upgrades.
- Prefer upstream-supported versions over local workaround pinning.
- If warnings remain after proper upgrades, identify whether they are upstream transitives and report that clearly.
- Do not hide unresolved advisories with sloppy shortcuts.

## Documentation Rules

- Update `README.md` when setup, test commands, version info, or important workflow expectations change.
- When changing Payload versions, update the README version entry immediately.
- Keep command examples aligned with the actual recommended workflow, especially `pnpm` usage and e2e commands.
- Keep `docs/contributor-guidelines.md`, `docs/cohort-spike-mvp-spec.md`, and `docs/portal-implementation-checklist.md` aligned when changing portal primitives, routes, seed behavior, or agent workflows.

## Portal Product Rules

The current product direction is a cohort project spike portal.

The portal should make real community activity visible and help people find a useful next step. It should not become a project management system, Discord replacement, course platform, handbook dump, or generic AI content feed.

Use these core primitives consistently:

- `Brief`: current snapshot of what is happening overall.
- `Project`: focused collaboration surface for something being built.
- `Thread`: persistent line of thought or work that evolves over time.
- `Activity Item`: factual signal that something happened.
- `Event`: scheduled session or calendar anchor.
- `Profile`: person or contributor identity.

Before adding a field, collection, page, or automation, identify which primitive it belongs to. Keep each primitive focused. Do not make `projects` carry unrelated behavior such as task boards, assignments, sprint state, or issue tracking.

## Portal Content Rules

- Surface real, recent, human activity.
- Prefer dated, source-grounded activity over broad summaries.
- Keep activity items short, factual, and traceable to meetings, Discord summaries, repo activity, or project updates.
- Prefer updating existing threads over creating new threads.
- Create projects only when there is a concrete collaboration surface with state, people, links, or a next action.
- Events/sessions must make it easy to join or add to a personal calendar.
- Avoid marketing language, generic AI filler, invented urgency, invented participants, and inferred commitments.

## Feature Module Rules

Treat new product areas as feature modules unless they clearly belong to a core primitive.

Examples:

- bounty board
- project phases
- resource library
- calendar subscription
- agent template registry
- contribution points automation

Add a new collection only when the feature needs its own lifecycle, permissions, reusable records, filtering/search/admin management, publishing/review, relationships from multiple primitives, or future API consumption.

If a feature is only a label, link, CTA, or short list, start with an existing primitive field or derived UI instead of a new collection.

## Agent Skill Rules

The repo-owned portal skill lives at:

- `.agents/skills/portal-memory-publisher/SKILL.md`

The app serves that skill from:

- `/api/portal/skills/portal-memory-publisher`

Use this skill when converting Discord summaries, meeting digests, community memory, project updates, event notes, or repo activity into portal CMS update proposals.

Default agent behavior should be review-first:

- propose creates/updates before writing to Payload
- draft low-confidence records
- publish only when facts are clear and policy allows
- preserve source labels, timestamps, and uncertainty
- avoid PM-tool drift

Do not let an agent silently publish invented content or silently change production seed behavior.

## Change Safety Rules

- Avoid destructive git operations unless explicitly requested.
- Do not revert unrelated user changes.
- Keep fixes minimal, intentional, and project-specific.
- If a framework or dependency upgrade requires code changes, make the compatibility changes explicitly instead of papering over the problem.

## Preferred Verification Commands

- Install dependencies: `corepack pnpm install`
- Rebuild native dependencies if needed: `corepack pnpm deps:native`
- Run e2e: `corepack pnpm test:e2e`
- Run headed e2e: `corepack pnpm test:e2e:headed`
- Run manual-review e2e: `corepack pnpm test:e2e:manual`
- Check audit state: `corepack pnpm audit --json`

## Final Reminder

- Keep the repo maintainable.
- Keep the README honest.
- Push to `staging`.
- Let the human merge to `master`.
