# Portal Documentation

This directory captures product direction, feature specs, contributor guidance,
and implementation checklists for the RaidGuild Portal.

## Portal Mental Model

The Portal is a live snapshot of the RaidGuild cohort. It should show what is
happening, why it matters, when to show up, and how to jump in.

It is not a Discord replacement, project management tool, course platform, or
handbook. The system should model observable community signals and surface them
clearly.

Core primitives:

- `Brief`: current snapshot of what is happening overall.
- `Project`: focused collaboration surface for something being built.
- `Thread`: persistent line of thought or work that evolves over time.
- `Activity Item`: factual signal that something happened.
- `Event`: scheduled gathering or calendar anchor.
- `Profile`: person or contributor identity.

Relationship shape:

```txt
Brief
  -> Activity Items
  -> Threads
  -> Projects
  -> Events

Project
  -> Activity Items
  -> Threads
  -> Events
  -> Contributors

Thread
  -> Activity Items
  -> Events
  -> Projects
  -> Participants
```

Threads can span multiple projects or remain projectless when they represent a
cohort-wide storyline. Projects and threads can both have activity and related
sessions. The MVP should not support threads of threads, projects of projects,
or parent/child hierarchies.

The main portal surfaces are:

- unauthenticated home: public weekly brief, upcoming sessions, active work, and
  a clear join path
- authenticated brief/dashboard: latest daily brief, activity, active threads,
  sessions, projects, and contributor actions
- project pages: what is being built, current state, activity, threads, sessions,
  contributors, and ways to contribute
- session pages: upcoming and past calendar anchors with project/thread context

## Notes

- [Product overview](./portal-product-overview.md)
- [Portal direction](./portal-direction.md)
- [Portal launch announcement draft](./portal-launch-announcement-draft.md)
- [Roles and capabilities](./roles-and-capabilities.md)
- [Contributor guidelines](./contributor-guidelines.md)
- [Cohort project spike MVP spec](./cohort-spike-mvp-spec.md)
- [Generic community portal template spec](./generic-community-portal-template-spec.md)
- [Sessions MVP spec](./sessions-mvp-spec.md)
- [Skill / Role Explorer feature spec](./skill-role-explorer-feature-spec.md)
- [Launch invites feature spec](./launch-invites-feature-spec.md)
- [Onboarding and inquiry funnel feature spec](./onboarding-funnel-feature-spec.md)
- [Notifications feature spec](./notifications-feature-spec.md)
- [Modules feature spec](./modules-feature-spec.md)
- [Infinite Wiki feature spec](./infinite-wiki-feature-spec.md)
- [Implementation checklist](./portal-implementation-checklist.md)
