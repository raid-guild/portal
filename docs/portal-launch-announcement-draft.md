# Portal Launch Announcement Draft

## Status

Draft announcement copy for BD/content review. This is not final launch copy.

## Title Options

- Introducing The Portal: RaidGuild's Digital Coworking Space
- The Portal Is Open
- RaidGuild Portal: A Living Interface for Guild Work
- The Portal: Where RaidGuild's Work Becomes Visible

## Draft Announcement

RaidGuild is launching **The Portal**, a new public and member-facing interface
for seeing what is happening across the guild.

The Portal is not a generic community site, a project management tool, or a
replacement for Discord. It is a living surface for guild activity: current
work, upcoming sessions, active projects, member profiles, contribution
requests, updates, and the knowledge trails that emerge from real
participation.

The core idea is simple:

RaidGuild needed a digital coworking space.

Discord is where conversation happens. GitHub is where code moves. Notion,
docs, calls, briefs, and agents all hold pieces of the picture. The Portal
brings those signals into one visible layer so members, contributors, clients,
agents, and curious builders can understand what is happening now and where to
plug in next.

## What The Portal Does

The Portal currently supports:

- **Briefs and updates**: current snapshots of guild activity, surfaced as
  digestible updates.
- **Projects**: focused collaboration surfaces for things being built.
- **Sessions**: public and member-aware calendar pages for workshops,
  brownbags, demos, all hands, firesides, and cohort gatherings.
- **Member profiles**: public contributor identity, skills, roles, links,
  badges, and related public work.
- **Contribution requests**: lightweight asks connected to projects, sessions,
  posts, profiles, or threads.
- **Posts and publishing**: public and member-only writing, with agent-assisted
  content workflows.
- **Badges and points**: early recognition systems for participation,
  contribution, hosting, publishing, and community signal.
- **Notifications**: in-app and email-ready infrastructure for reminders,
  updates, and follow-up.
- **Agent skills**: structured instructions for agents to propose or create
  Portal records without inventing context or drifting into generic content.

## Design Patterns

The Portal is built around a few strong opinions.

First, it favors **observable activity** over broad summaries. A good Portal
record should point to something that happened: a session, a project update, a
Discord summary, a post, a contribution request, a shipped feature, or a member
profile.

Second, it keeps primitives small and focused:

- `Brief` is the current snapshot.
- `Project` is the collaboration surface.
- `Thread` is the evolving line of thought.
- `Activity Item` is a factual signal.
- `Session` is the calendar anchor.
- `Profile` is the person or contributor identity.

Third, it avoids becoming a project management system. Projects can show
context, links, contributors, related sessions, and contribution requests. They
are not trying to replace Linear, GitHub Issues, Notion, or Discord.

Fourth, it is designed for **humans and agents working together**. Agents can
help gather memory, draft updates, propose CMS records, create sessions, attach
artifacts, and feed content pipelines. But the Portal should remain grounded in
reviewable, traceable community activity.

## Agentic Use

The Portal is intentionally agent-friendly.

Agents can use dedicated skills and API paths to:

- propose updates from Discord summaries or meeting digests
- create or enrich session records
- attach recordings, transcripts, summaries, and artifacts
- draft posts from community memory
- update briefs from recent activity
- create contribution requests from real project needs
- support recurring session workflows
- help maintain member and project context

This is not "AI content feed" behavior. The goal is not to generate infinite
filler. The goal is to help the guild preserve signal, reduce coordination
loss, and make useful work easier to find.

Agent admin is treated as a real product surface. Agents should operate with
scoped roles, clear permissions, explicit skills, and review-first defaults.
When agents publish or update records, the Portal should make that behavior
understandable and auditable.

## Sessions As A Hub

Sessions are becoming one of the central objects in the Portal.

A session can start as a future event: a workshop, demo, brownbag, pitch,
fireside, or all hands. After it happens, it can become a durable source
artifact with notes, recordings, transcripts, projects, contribution requests,
comments, and follow-up content.

That gives RaidGuild a better path from live conversation to reusable
knowledge:

```txt
Session -> artifacts -> posts -> project updates -> wiki candidates -> contribution requests
```

This is especially important for cohort work, fireside chats, onboarding, and
content production.

## Content Pipelines

The Portal also supports an emerging content pipeline.

A member interview, fireside chat, project session, or community discussion can
become:

- a session record
- a transcript or summary artifact
- a public recap post
- a short-form content draft
- a project update
- a contribution request
- a future wiki source
- profile enrichment for the people involved

The Portal is the presentation and coordination layer. Other systems can handle
memory, generation, editing, and publishing workflows, but the Portal gives the
output a place to land.

## Why It Matters

RaidGuild has always been more alive than its public surface suggested.

The Portal makes that activity visible.

It gives new contributors a place to start. It gives members a better way to
understand current work. It gives agents a structured way to help without
inventing context. It gives clients, sponsors, and collaborators a clearer
picture of how the guild works.

Most importantly, it creates a shared interface for turning activity into
memory, memory into context, and context into useful next steps.

The Portal is open. Come see what the guild is building.
