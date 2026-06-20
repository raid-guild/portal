# Interactive Map Dashboard Feature Spec

## Status

First slice implemented.

Portal now includes an authenticated `/dashboard/map` route with a responsive
map stage, role-based character selector, path/node movement, location dialogs
backed by current Portal data, a display-safe point leaderboard endpoint, and
`dashboard-map` CMS-managed page copy fallbacks/seeds.

The remaining polish items are deeper visual QA, richer per-location CMS copy,
expanded reduced-motion/mobile coverage, and any future free-walk collision
work if the art pipeline gains collision metadata.

## Product Intent

The map dashboard should make the Portal feel like a navigable guild world while
still doing the practical work of a dashboard:

- let a signed-in user choose a character based on their selected profile roles
- materialize that character onto the world map
- let the user move to recognizable map locations
- open fantasy game dialogs with current Portal data and a clear next action
- keep the normal Portal routes as the source of truth for deeper workflows

This should be an alternate dashboard view, not a new core primitive. It should
compose existing Portal primitives and modules: posts, modules, wiki pages,
events, feedback, profiles, daily engagement, and point events.

## Evaluation

The idea fits the Portal well because the art gives the dashboard a memorable
orientation layer without changing the underlying product model. It can make the
portal feel alive, but it should stay bounded: users still need to reach posts,
wiki pages, sessions, feedback, modules, and check-ins quickly.

The main implementation risk is movement. The background art is a single
1920x1080 raster image with no tile metadata, collision layer, or object map.
Free walking with believable obstacle collision is possible, but it would
require a hand-authored collision mask or navigation mesh. A path/node movement
model is the best first version because the paths are clearly painted into the
map and the destination set is small.

The second risk is accessibility. A game map is inherently spatial and visual,
so v1 should include keyboard controls, focus-managed dialogs, reduced-motion
handling, and a compact destination menu that exposes the same actions without
requiring pointer movement.

## Initial Asset Review

Backgrounds reviewed before cleanup:

```txt
public/assets/map/backgrounds/adventure-map-background.png
public/assets/map/backgrounds/adventure-map-background.webp
public/assets/map/backgrounds/arena-dungeon.png
```

Recommended runtime background:

```txt
public/assets/map/backgrounds/adventure-map-background.webp
```

The adventure map is the right asset for this surface. It is 1920x1080, already
contains clear regions for lake, swamp, forest, village, mine, guild castle,
volcano, and lava castle, and has visible paths that can support a node graph.
Use the WebP in the runtime UI. Keep source-quality art outside `public` if the
art pipeline needs it.

Character assets reviewed before cleanup:

```txt
public/assets/map/characters/*.svg
public/assets/map/sprites/characters/*.png
public/assets/map/sprites/characters/*.json
public/assets/map/sprites/characters/*-preview.png
```

Each animated sprite sheet appears to use 10 horizontal cells. Example:

```json
{
  "cell": { "w": 54, "h": 68 },
  "names": [
    "idle-down",
    "idle-up",
    "idle-left",
    "idle-right",
    "attack-down",
    "attack-up",
    "attack-left",
    "attack-right",
    "frozen",
    "disconnected"
  ]
}
```

Available role sprite slugs:

```txt
alchemist
archer
cleric
druid
dwarf
healer
hunter
monk
necromancer
paladin
ranger
rogue
scribe
tavern-keeper
warrior
wizard
```

Profile role to asset mapping needs explicit aliases:

```txt
mystic-alchemist -> alchemist
angry-dwarf -> dwarf
tavern-keeper -> tavern-keeper
```

Known missing art:

```txt
apprentice
bard
```

For v1, show missing-art roles in the selector as unavailable with lore copy and
a profile link. Do not invent final art in code. If a user's only selected roles
are unavailable, keep the selector open and point them to `/me` to adjust roles
or wait for the art pass.

## Asset Requirements

The map directory should contain only assets that support the planned
`/dashboard/map` implementation. Current app code does not reference these yet,
so cleanup should be based on the planned runtime needs below.

### Required For V1 Runtime

Keep:

```txt
public/assets/map/backgrounds/adventure-map-background.webp
public/assets/map/sprites/characters/alchemist.png
public/assets/map/sprites/characters/archer.png
public/assets/map/sprites/characters/cleric.png
public/assets/map/sprites/characters/druid.png
public/assets/map/sprites/characters/dwarf.png
public/assets/map/sprites/characters/healer.png
public/assets/map/sprites/characters/hunter.png
public/assets/map/sprites/characters/monk.png
public/assets/map/sprites/characters/necromancer.png
public/assets/map/sprites/characters/paladin.png
public/assets/map/sprites/characters/ranger.png
public/assets/map/sprites/characters/rogue.png
public/assets/map/sprites/characters/scribe.png
public/assets/map/sprites/characters/tavern-keeper.png
public/assets/map/sprites/characters/warrior.png
public/assets/map/sprites/characters/wizard.png
```

The WebP background is the intended map stage image. The sprite sheets are the
runtime character assets for path/node movement.

### Recommended To Keep For V1

Keep:

```txt
public/assets/map/sprites/characters/*.json
```

These files are tiny and document the sprite sheet cell size and frame names.
The implementation can either load them or mirror the values in TypeScript
config. Keeping them makes the sprite contract explicit.

Keep the static character portraits if the character selector should feel like a
larger fantasy character dialog rather than a compact sprite picker:

```txt
public/assets/map/characters/alchemist.svg
public/assets/map/characters/archer.svg
public/assets/map/characters/cleric.svg
public/assets/map/characters/druid.svg
public/assets/map/characters/dwarf.svg
public/assets/map/characters/healer.svg
public/assets/map/characters/hunter.svg
public/assets/map/characters/monk.svg
public/assets/map/characters/necromancer.svg
public/assets/map/characters/paladin.svg
public/assets/map/characters/ranger.svg
public/assets/map/characters/rogue.svg
public/assets/map/characters/scribe.svg
public/assets/map/characters/tavern-keeper.svg
public/assets/map/characters/warrior.svg
public/assets/map/characters/wizard.svg
```

Recommendation: keep these portraits for the first implementation because the
character selector/profile dialog is planned to show lore and profile context,
and the portraits give that dialog more presence than a 54x68 sprite alone.

### Not Needed For V1

These can be removed from `public/assets/map` before implementation:

```txt
public/assets/map/backgrounds/adventure-map-background.png
public/assets/map/backgrounds/arena-dungeon.png
public/assets/map/sprites/characters/*-preview.png
```

Rationale:

- `adventure-map-background.png` duplicates the WebP map background and is much
  larger. Keep a source-quality PNG outside `public` only if the art pipeline
  needs it.
- `arena-dungeon.png` does not support the planned overworld dashboard map.
- `*-preview.png` files duplicate the first sprite frame. The selector can show
  the first frame directly from each sprite sheet or use the larger SVG
  portraits.

### Still Missing

The planned role-gated selector still lacks final assets for:

```txt
apprentice
bard
```

Until those exist, keep those roles visible as unavailable in the selector with
a profile-edit link to `/me`.

## Recommended Route

Add a member-facing route:

```txt
/dashboard/map
```

The route should behave like `/dashboard`:

- `force-dynamic`
- redirect anonymous users to `/join` or `/login` using the existing app
  convention
- show the email verification notice for unverified accounts
- fetch the current user and profile server-side
- render a client component for movement, character selection, dialogs, and
  animation

Add entry points later from `/dashboard`, `/me`, or nav. The map should remain
an alternate dashboard landing view until it has enough accessibility and data
coverage to become a default experience.

Use relative links in app code:

```txt
/me
/posts
/modules
/wiki
/events
/feedback
```

The production host `https://portal.raidguild.org` can keep resolving these
without hard-coding an origin.

## Data Needs

Create a server loader similar to
`src/app/(frontend)/dashboard/dashboardData.ts`, or extract shared dashboard
queries if reuse becomes clearer during implementation.

Initial map data:

```ts
type MapDashboardData = {
  profile: Profile | null
  selectableRoles: Array<{
    title: string
    slug: string
    description?: string | null
    spriteSlug?: string
    available: boolean
  }>
  latestPost: Post | null
  prototypeModules: Module[]
  recentWikiPages: WikiPage[]
  upcomingEvents: Event[]
  pointsTotal: number
  recentPointEvents: PointEvent[]
  leaderboard: Array<{
    rank: number
    displayName: string
    handle?: string
    avatarURL?: string
    isCurrentUser: boolean
    pointsTotal: number
  }>
  dailyEngagementSummary: {
    currentStreak: number
    hasCheckedInToday: boolean
    todayVibe?: string | null
  }
}
```

Queries:

- latest post: published posts sorted by `-publishedAt`, limit 1
- prototype modules: enabled modules where `status` is `idea` or `prototype`,
  sorted by `-featured,sortOrder,name`, limit 4 or 5
- recent wiki pages: published, reviewed, non-admin wiki pages sorted by
  `-lastReviewedAt`, limit 3
- upcoming sessions: published, non-admin events with `startsAt >= now`, sorted
  by `startsAt`, limit 3
- points: valid `pointEvents` for the current user, same total logic as the
  dashboard
- leaderboard: display-safe aggregate from `/api/portal/leaderboard/points`
- daily check-in: reuse the current daily engagement summary and
  `/api/daily-engagements/check-in`

Leaderboard endpoint:

Current `pointEvents` access is own-events-or-admin. A member-visible
leaderboard should not query all raw point events directly from the client. Add
a narrow authenticated endpoint:

```txt
GET /api/portal/leaderboard/points
```

Response shape:

```ts
type PointsLeaderboardResponse = {
  entries: Array<{
    rank: number
    displayName: string
    handle?: string
    avatarURL?: string
    isCurrentUser: boolean
    pointsTotal: number
  }>
  generatedAt: string
}
```

Endpoint rules:

- require a verified authenticated user
- aggregate only valid `pointEvents`
- return display-safe profile data only
- include public and authenticated profiles; exclude private profiles unless
  they belong to the current user
- do not expose raw event rows, user IDs, reasons, issued-by data, or private
  profile fields
- return only the top 10 entries
- include only users/profiles with a positive valid point total

Implementation can use Payload local API reads with `overrideAccess: true` in
the route handler, then enforce the display policy in code before returning the
response. If this becomes expensive, add a cached aggregate later rather than
changing the first API contract.

## Map Locations

Coordinates are approximate percentages against the 1920x1080 background. The
implementation should keep these in a plain config file so they can be tuned
without touching movement logic.

| Location | Region | Approx hotspot | Dialog data | Action |
| --- | --- | --- | --- | --- |
| Slop Swamp | lower-left swamp | `18%, 75%` | latest published post | `/posts` |
| Lava Castle | far-right castle | `91%, 51%` | enabled modules with `idea` or `prototype` status | `/modules` |
| Forest of Unknown Knowledge | tree entry near upper middle-left | `33%, 23%` | latest reviewed wiki pages | `/wiki` |
| The Village | lower-middle town | `51%, 78%` | upcoming session records | `/events` |
| Guild Castle | main mountain castle, entered through mine | mine at `51%, 54%`; castle visual at `58%, 15%` | static "work will return soon" copy | disabled |
| Hut of Helpless Whispers | forest hut shown in the supplied screenshot | `29%, 34%` | request/feedback lore copy | `/feedback` |
| Lunker Lake | lake on left side | `12%, 40%` | user's guild points, daily check-in, leaderboard | no route |

Use `Slop Swamp` in UI copy.

## Movement Options

### Option 1: Hotspot Only

The simplest implementation is a static map with clickable destination markers.
Selecting a marker opens the dialog immediately.

Pros:

- fastest to ship
- easiest to make accessible
- no animation or collision complexity

Cons:

- does not satisfy the character-movement fantasy
- feels more like illustrated navigation than a game map

### Option 2: Path/Node Movement

Selected for v1.

Create a graph of path nodes that follows the painted roads. Users click a
location, select it from a destination menu, or use keyboard controls to choose
nearby nodes. The character interpolates from node to node and faces the
movement direction. A location dialog opens when the character reaches the
destination.

Pros:

- respects visible paths and obstacles without needing collision detection
- gives the character movement moment the concept needs
- works with pointer, keyboard, and destination-menu input
- can be implemented with React, CSS, and `requestAnimationFrame`
- avoids adding a game engine dependency for a small navigation surface

Cons:

- movement is less free than a full game
- route graph needs hand tuning
- users may expect to walk anywhere unless the UI makes destinations clear

### Option 3: Free Walk With Collision

Allow arrow/WASD movement across the map and block movement with collision
geometry.

This needs one of:

- a hand-authored collision mask image where walkable pixels are one color
- a manual polygon/navmesh layer stored as JSON
- a tile map exported from a map editor

Pros:

- strongest game feel
- allows wandering and discovery

Cons:

- highest implementation cost
- hard to tune against raster art
- easy to create frustrating invisible walls
- more testing required on mobile and zoomed viewports

Decision: build path/node movement first. Add free movement only after the art
pipeline includes a collision mask or navmesh.

## Client Architecture

Suggested files:

```txt
src/app/(frontend)/dashboard/map/page.tsx
src/app/(frontend)/dashboard/map/mapData.ts
src/app/(frontend)/dashboard/map/MapDashboardClient.tsx
src/app/(frontend)/dashboard/map/MapCharacterSelector.tsx
src/app/(frontend)/dashboard/map/MapDialog.tsx
src/app/(frontend)/dashboard/map/MapLocationDialog.tsx
src/app/(frontend)/dashboard/map/MapSprite.tsx
src/app/(frontend)/dashboard/map/mapConfig.ts
src/app/(frontend)/dashboard/map/useMapMovement.ts
src/app/(frontend)/api/portal/leaderboard/points/route.ts
```

Recommended rendering approach:

- Render a full-viewport map stage with `aspect-ratio: 16 / 9`.
- Use the WebP background image as an actual `img` or CSS background.
- Position nodes, markers, and character in percent coordinates.
- Keep a constant internal coordinate system of `1920 x 1080` or `0..1`
  normalized coordinates.
- Convert coordinates to CSS percentages for DOM placement.
- Use `transform: translate(-50%, -100%)` for sprite feet alignment.
- Use the sprite sheet PNG with CSS `background-position` for facing states.
- Use `requestAnimationFrame` only while the character is traveling.
- Respect `prefers-reduced-motion` by snapping to the destination or using a
  short fade/materialize effect.

No new dependency is needed for v1. A canvas or Pixi-style renderer can be
considered later if the map grows into a fuller game surface with particles,
multi-frame walking animations, layered objects, and collision.

## Dialog System

Create a reusable game-styled dialog component for:

- character selection
- location content
- daily check-in inside Lunker Lake
- disabled/coming-soon states
- missing profile or missing role art states

Requirements:

- `role="dialog"` and `aria-modal="true"`
- labelled title and optional description
- focus trapped while open
- Escape closes non-required dialogs
- character selector starts open and should not be dismissible until a character
  is selected, unless the user chooses to leave the map
- visible profile link to `/me`
- fantasy game border treatment implemented in CSS, not image-only UI
- no hidden requirement to use a mouse

Load lore copy from CMS-managed page copy, with code defaults as fallbacks so
the map remains usable if the CMS record is missing or incomplete.

## CMS Fit

This feature fits the CMS as structured copy for a fixed product route, not as a
generic page-builder page.

Recommendation:

- Keep map locations, node graph, coordinates, routes, asset mapping, and data
  bindings in code.
- For v1, extend the existing `PageCopy` pattern with a fixed `dashboard-map`
  key for lore copy.
- Add a `dashboard` or `map` surface option to `PageCopy`.
- Ship initial lore copy as code fallbacks and seed/default CMS copy that can be
  revised after implementation.
- Do not add a new collection unless map locations become independently managed
  records with their own lifecycle, permissions, ordering, filtering, or reuse
  outside this dashboard.

## Character Selection

Flow:

1. Load the user's profile and `profileRoles` at depth 1.
2. Map selected role slugs to sprite slugs.
3. Show only the user's selected roles in the selector.
4. Mark `apprentice` and `bard` as unavailable until art exists.
5. Let the user open `/me` from the selector to edit roles.
6. Persist the selected sprite in `localStorage` by profile ID or user ID.
7. If the persisted selection is no longer one of the user's current roles,
   clear it and show the selector again.
8. After selection, materialize the sprite near the village or central path
   crossroads.
9. Let the user click or keyboard-focus the active character to reopen the
   selector and change characters.

Because character choice is browser-only for v1, do not add a profile field for
selected character yet. The selector dialog can double as a small character
profile panel with:

- display name and handle
- avatar, if present
- selected profile roles
- selected profile skills
- current point total
- current daily check-in/streak state
- links to `/me` and the public profile when available

Recommended spawn point:

```txt
49%, 64%
```

This is near the central crossroads and keeps every destination reachable by the
path graph.

## Location Dialog Content

### Slop Swamp

Show:

- latest post title
- published date
- short description if available
- button to `/posts`

Empty state:

```txt
The muck is quiet. No fresh post has bubbled up yet.
```

### Lava Castle

Show:

- up to 4 enabled modules where status is `idea` or `prototype`
- status label
- short summary
- button to `/modules`

Empty state:

```txt
No volatile prototypes are glowing today.
```

### Forest of Unknown Knowledge

Show:

- latest reviewed wiki pages
- summary or key claim preview where available
- button to `/wiki`

### The Village

Show:

- next 3 upcoming sessions
- date/time
- join and add-to-calendar links where present
- button to `/events`

### Guild Castle

Show static copy for now:

```txt
This is where the guild does work. No work is posted here right now. Come back soon.
```

The action should render disabled until there is a concrete destination. Do not
invent task-board, assignment, sprint, or issue-tracking behavior.

### Hut of Helpless Whispers

Show:

- request/feedback lore copy
- button to `/feedback`

### Lunker Lake

Show:

- current user's guild point total
- recent point events
- current daily check-in status
- the existing daily vibe check interaction
- point leaderboard from `/api/portal/leaderboard/points`

Reuse the behavior of `VibeCheckButton` or extract a shared check-in component
if the current dashboard component is too tied to its existing styling.

## Accessibility And Mobile

Minimum requirements:

- destination menu with buttons for every location
- keyboard travel: arrow keys or tabbed destination buttons are acceptable for
  v1
- dialog focus management
- reduced-motion support
- all dialogs usable at 320px width
- map can scroll/pan or scale without hiding essential controls
- markers have accessible labels
- selected character has accessible text outside the sprite image

Suggested mobile approach:

- keep the map in a 16:9 stage wider than the viewport
- allow horizontal panning or drag-scroll
- keep a compact bottom destination bar outside the map stage
- open dialogs full-width with the same game border style

## Implementation Phases

### Phase 1: Route And Data

- Add `/dashboard/map` route with the same auth and verification gates as
  `/dashboard`.
- Keep the route hidden from primary dashboard navigation until after visual QA.
- Add `getMapDashboardData(user)` server loader.
- Fetch profile roles, latest post, prototype modules, recent wiki pages,
  upcoming sessions, points, leaderboard entries, and daily engagement summary.
- Add `GET /api/portal/leaderboard/points` for display-safe aggregate point
  totals.
- Add `dashboard-map` `PageCopy` support for editable lore copy with code
  fallbacks.
- Add basic route-level e2e coverage that authenticated users can reach the map.

### Phase 2: Map Stage And Dialog Shell

- Build the responsive map stage using `adventure-map-background.webp`.
- Add `MapDialog` with fantasy border styling and accessible focus behavior.
- Add destination markers and the destination menu.
- Add location dialogs with real fetched data and empty states.

### Phase 3: Character Selector

- Add role-to-sprite mapping.
- Add selector dialog.
- Handle missing profile, missing roles, and missing art states.
- Persist selected character locally.
- Render the selected sprite at the spawn point with a materialize animation.
- Reopen the selector/profile dialog when the user activates the character.

### Phase 4: Path Movement

- Add path graph config over the painted roads.
- Move the character between nodes with `requestAnimationFrame`.
- Open destination dialogs on arrival.
- Add reduced-motion behavior.
- Add keyboard or destination-menu movement coverage.

### Phase 5: Lunker Lake Check-In

- Reuse or extract the existing daily vibe check component.
- Show point total and recent point events.
- Show leaderboard entries from the display-safe aggregate endpoint.

### Phase 6: Verification And Polish

- Run `corepack pnpm test:e2e`.
- Add Playwright coverage for character selection, one location dialog, and
  daily check-in availability.
- Use `corepack pnpm test:e2e:headed` or `corepack pnpm test:e2e:manual` for
  visual review before shipping because this is a visible browser flow.
- Check desktop and mobile screenshots for text overlap, nonblank assets, and
  usable dialogs.

## Testing Notes

Relevant verification after implementation:

```txt
corepack pnpm test:e2e
```

Additional manual/visual verification:

```txt
corepack pnpm test:e2e:headed
```

or:

```txt
corepack pnpm test:e2e:manual
```

Test scenarios:

- anonymous user cannot access `/dashboard/map`
- unverified user sees the verification notice
- verified user with available profile role sees character selector
- user with only unavailable art roles sees unavailable state and `/me` link
- selecting a character renders a sprite on the map
- activating the selected character reopens the selector/profile dialog
- selecting each destination opens the correct dialog
- Lunker Lake check-in submits through the existing endpoint
- Lunker Lake renders leaderboard entries without raw point-event details
- reduced-motion mode does not require animation to complete

## Decisions

- Use `/dashboard/map`.
- Use path/node movement for v1.
- Persist selected character in the browser only for v1.
- Reopen the character selector/profile dialog when the user activates the
  character.
- Use `Slop Swamp`.
- Use the forest hut shown in the supplied screenshot for the Hut of Helpless
  Whispers.
- Keep `/dashboard/map` hidden from primary dashboard navigation until after
  visual QA.
- Plan a display-safe point leaderboard API for Lunker Lake that returns the top
  10 users/profiles with positive valid point totals.
- Use `PageCopy` with a `dashboard-map` key for editable lore copy, seeded from
  initial implementation copy and backed by code fallbacks.

## Remaining Open Questions

- What exact lore copy should ship for each location and character role? The
  first implementation should fill this in, then editors can revise it in CMS.

## Recommendation

Build v1 as `/dashboard/map` with path/node movement, reusable game dialogs,
role-limited character selection, browser-only character persistence, real
dashboard data, CMS-editable lore copy, and a display-safe top-ten point
leaderboard endpoint. Keep free walking out of v1 unless the art pipeline gains
collision metadata.
