---
name: portal-memory-publisher
description: Convert Discord summaries, meeting digests, community memory, project updates, event notes, or repo activity into reviewable Payload CMS update proposals for the RaidGuild portal. Use when Codex needs to update or propose updates for briefs, projects, threads, activity items, events/sessions, or profiles from real community activity while avoiding invented content and project-management drift.
---

# Portal Memory Publisher

## Operating Rule

Convert observed community memory into portal records. Do not invent activity, project state, people, dates, links, or decisions.

Default to a reviewable update plan. Write directly to Payload only when the user explicitly asks and the target environment is clear.

When writing directly to Payload as an automated publisher, use a dedicated agent account. Do not use a human contributor account for automated publishing.

## Source Inputs

Use this skill for:

- Discord channel summaries
- meeting digests or transcripts
- project updates
- event/session notes
- repo activity summaries
- community memory rollups

If the input lacks timestamps, participants, or sources, preserve uncertainty and draft the record instead of publishing it.

## Portal Primitives

Use the repo model in `references/portal-cms-model.md` when field-level detail is needed.
Use `references/example-digest-mapping.md` when an example output shape is useful.

- `activityItems`: factual dated signals; what happened.
- `threads`: ongoing lines of work/thought; what keeps evolving.
- `events`: sessions/calendar anchors; when people should show up.
- `projects`: live collaboration surfaces; what is being built.
- `dailyBriefs`: assembled current snapshot; what matters now.
- `profiles`: people/contributors; who is involved.

## Workflow

1. Extract factual signals from the source.
2. Identify existing projects, threads, events, and profiles that should be updated.
3. Prefer updating existing threads over creating new threads.
4. Create new projects only when there is a concrete collaboration surface with state, people, links, or a next action.
5. Create activity items for specific dated events, decisions, blockers, insights, or contributions.
6. Create or update events only for real sessions with time, location/join/calendar context, or clear follow-up action.
7. Assemble the daily brief from related activity, threads, projects, events, and engagement actions.
8. Output a reviewable plan with create/update operations and confidence.

## Agent Account Flow

Normal public account creation through `POST /api/users` creates a human contributor account. Agent accounts use a separate gated route so the `agent` role is explicit.

Create an agent account only when the target environment and registration secret are provided:

```bash
curl -X POST "$PORTAL_URL/api/agent/register" \
  -H "Authorization: Bearer $AGENT_REGISTRATION_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "portal-memory-agent@example.com",
    "password": "long-random-agent-secret",
    "name": "Portal Memory Agent"
  }'
```

Log in and store cookies before writing CMS records:

```bash
curl -c cookies.txt -X POST "$PORTAL_URL/api/users/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "portal-memory-agent@example.com",
    "password": "long-random-agent-secret"
  }'
```

Use `-b cookies.txt` for subsequent API requests. Verify the session with `GET /api/users/me`.

Agent accounts are contributor-level publishers. They may create draft/proposal records from sourced memory, but they must not publish, delete, manage users, or impersonate humans.

## Confidence Rules

- `publish`: source is clear, factual, dated, and non-sensitive.
- `draft`: source is plausible but incomplete, ambiguous, sensitive, or needs human wording.
- `skip`: source is generic, duplicative, speculative, private, or not useful to the portal.

Never publish:

- inferred commitments
- invented quotes
- private contact details
- task assignments not explicitly stated
- token/payment claims without source support

## Create vs Update

Update existing records when the source continues a known storyline:

- same project spike
- same thread title/topic
- same upcoming session
- same contributor profile
- same daily brief date/focus

Create new records when the source introduces a distinct real object:

- new project spike with a clear collaboration surface
- new thread that will likely recur
- new dated activity item
- new scheduled session

## Output Format

Return this shape unless the user requests direct edits:

```txt
Source summary:

Proposed creates:
- collection:
  confidence:
  fields:
  source:

Proposed updates:
- collection:
  record:
  confidence:
  changes:
  source:

Skipped:
- item:
  reason:

Review notes:
```

## Guardrails

- Keep projects as collaboration surfaces, not task boards.
- Do not create tasks, assignees, sprint boards, estimates, or PM workflow state.
- Keep activity short, dated, and source-grounded.
- Keep threads lightweight; they are continuity, not categories or tickets.
- Keep sessions practical: title, time, join link, add-to-calendar link, related projects/threads.
- Use agent accounts for automated CMS updates; use human accounts only for human-authored updates.
- Use direct, human wording. Avoid marketing language and generic AI summaries.
