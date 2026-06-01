# Widget Bubble Feature Spec

## Status

MVP implementation completed (first pass). This spec documents a small floating
launcher for feedback and bug reports. The first implementation should stay
simple and should not become a support desk, Discord replacement, or Prism chat
surface yet.

The launcher should be generic enough to evolve later into a Prism chat or
assistant entry point.

## Product Intent

The portal needs a low-friction way for users to report bugs, submit feedback,
and flag confusing product moments while they are still in context.

The widget should answer:

- Where can I quickly report a bug or rough edge?
- Can the portal capture the page where the issue happened?
- Can admins triage feedback without adding another external tool yet?
- Can this surface become a richer assistant/chat launcher later?

## Naming

Use generic product naming rather than feedback-only naming.

Recommended internal names:

```txt
WidgetBubble
WidgetBubbleLauncher
PortalWidgetBubble
```

Avoid names like `FeedbackBubble` for the primary shell component because the
future action may be feedback, bug report, Prism chat, or another quick action.

The MVP action can still be labeled:

```txt
Feedback
Report bug
```

## Environment Toggle

The widget should be controlled by a frontend-safe env var:

```txt
NEXT_PUBLIC_WIDGET_BUBBLE_ENABLED
```

Default behavior:

- enabled by default when the env var is missing
- disabled only when explicitly set to `false`, `0`, or `off`

This keeps the widget available in normal deployments while allowing production,
staging, or review apps to hide it quickly if it becomes noisy.

Example helper behavior:

```txt
undefined -> enabled
true -> enabled
1 -> enabled
false -> disabled
0 -> disabled
off -> disabled
```

## MVP Experience

### Desktop

Show a compact fixed-position button in the bottom-right viewport area.

Guidelines:

- icon-first button, roughly square
- hover/focus label or tooltip: `Feedback`
- do not use a large chat-style pill
- keep it inside viewport bounds and away from scrollbars
- respect existing right margin without feeling detached from the app

Recommended first action:

```txt
/feedback?from=<current-path>
```

A full page is acceptable for MVP because it is easier to make accessible,
mobile-safe, and reviewable than a custom modal.

### Mobile

Mobile real estate is tighter, so the widget should be conservative.

Guidelines:

- use a small accessible button, around 44px by 44px
- position with safe-area support:

```css
bottom: calc(env(safe-area-inset-bottom) + 16px)
right: 16px
```

- hide or suppress the floating widget while text inputs are focused if it
  conflicts with the keyboard
- always include a non-floating feedback path in the account menu

If the floating button feels too crowded on mobile after testing, keep the
account-menu link and disable the floating mobile launcher with configuration or
a responsive rule.

## Feedback Collection

Use one collection for feedback and bug submissions.

Collection slug:

```txt
feedbackSubmissions
```

Suggested fields:

```txt
type: bug / feedback / idea / content_issue / account_issue / other
status: new / triaged / planned / resolved / closed / spam
priority: low / normal / high / urgent
title: text
message: textarea
submittedBy: relationship -> users
submittedProfile: relationship -> profiles
email: email
pageURL: text
userAgent: text
viewport: json
metadata: json
adminNotes: textarea
createdAt
updatedAt
```

For the MVP, priority and status are admin-managed. Users should not need to
understand triage vocabulary.

## Form Behavior

Authenticated users:

- auto-link `submittedBy`
- auto-link `submittedProfile` when available
- capture current path or full URL
- allow optional screenshot later, but do not require uploads for MVP

Anonymous users:

- allow only if the route/page chooses to expose anonymous feedback
- require an email if follow-up is expected
- consider limiting anonymous access to public funnel, join, and brief pages to
  reduce spam

Recommended fields for the public form:

```txt
type
title
message
email when anonymous
```

Hidden/captured context:

```txt
pageURL
userAgent
viewport
submittedBy
submittedProfile
```

## Placement

Render the launcher from the frontend shell/layout so it appears across portal
surfaces.

Recommended placements:

- floating widget bubble on desktop/tablet
- account menu link for authenticated users
- footer or small text link on public pages if the floating widget is disabled

Do not place the widget inside Payload Admin.

## Future Prism Path

The widget bubble can become a generic launcher with multiple actions:

```txt
Send feedback
Report bug
Ask Prism
```

Future Prism chat behavior should remain separate from the feedback collection.
Chat sessions may need their own state, permissions, transcript retention, and
agent safety rules. The MVP feedback flow should not block on that design.

## Admin Workflow

Admins and editors review submissions in Payload Admin.

MVP workflow:

1. User submits feedback.
2. Record is created with `status: new`.
3. Admin triages into `triaged`, `planned`, `resolved`, `closed`, or `spam`.
4. Admin may manually create a GitHub issue or follow up with the submitter.

Do not auto-create GitHub issues initially. Add that only when triage volume
justifies it.

## Access Rules

Recommended MVP access:

- authenticated users can create feedback submissions
- anonymous users can create only if anonymous feedback is intentionally enabled
- users can read their own submissions if a “my feedback” view is added later
- editors/admins can read and update all submissions
- only admins can delete submissions

## Open Questions

- Should anonymous feedback be enabled globally or only on public onboarding
  funnel pages?
- Should mobile floating behavior default on, or should mobile use only the
  account menu link at first?
- Should feedback submissions create admin notifications immediately?
- Should screenshot upload be supported in the first pass, or deferred until
  feedback volume proves it is needed?
- Should resolved feedback notify the submitter once notification preferences
  are mature?

## First Implementation Checklist

- [x] Add `feedbackSubmissions` collection.
- [x] Add `/feedback` route with a simple accessible form.
- [x] Add `WidgetBubble` launcher to the frontend shell.
- [x] Add `NEXT_PUBLIC_WIDGET_BUBBLE_ENABLED` helper with default-on behavior.
- [x] Add account-menu `Feedback` link.
- [x] Capture `from` URL and browser context.
- [x] Add admin default columns for status, type, title, submitter, and created date.
- [x] Add focused e2e coverage for authenticated feedback submission.
