# Example Digest Mapping

Input: May 11, 2026 Cohort Voice meeting digest.

## Proposed creates

- collection: `events`
  confidence: `publish`
  fields:
    - `title`: `Cohort Project Spike Sync`
    - `startsAt`: follow-up sync date/time from source
    - `locationLabel`: `Discord #cohort-voice`
    - `relatedProjects`: `Cohort Project Spike Portal`
    - `relatedThreads`: `Defining the project spike object`, `Calendar and session coordination`
  source: meeting action item to schedule next coordination sync

- collection: `activityItems`
  confidence: `publish`
  fields:
    - `title`: `Group narrowed the portal around project spikes instead of broad PM tooling.`
    - `activityType`: `decision`
    - `happenedAt`: `2026-05-11T17:00:00.000Z`
    - `relatedProject`: `Cohort Project Spike Portal`
    - `relatedThread`: `Defining the project spike object`
    - `creditedProfiles`: only participants whose contribution to the decision is identified in the source
  source: meeting summary and quotes

- collection: `threads`
  confidence: `publish`
  fields:
    - `title`: `Calendar and session coordination`
    - `summary`: `Making the next live moment visible and easy to add to personal calendars.`
    - `threadStatus`: `active`
  source: calendar action item and session discussion

## Proposed updates

- collection: `projects`
  record: `Cohort Project Spike Portal`
  confidence: `publish`
  changes:
    - add current state bullets
    - link related activity items
    - link active threads
    - link next session event
  source: meeting alignment around project spike portal scope

- collection: `dailyBriefs`
  record: latest brief for meeting date
  confidence: `draft`
  changes:
    - set `statusLabel` to `Active Now`
    - set `focusLabel` to `Project Spike Portal`
    - set `nextEvent`
    - add related activity items and threads
    - add engagement actions for joining session, adding calendar, and viewing project
  source: meeting summary

## Skipped

- item: token mechanics
  reason: discussed as future possibility, not MVP behavior

- item: project management workflow
  reason: group explicitly avoided task-board/PM-tool scope
