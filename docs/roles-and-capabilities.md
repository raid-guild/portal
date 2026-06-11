# Roles And Capabilities

This document describes auth roles on `users.roles`. These roles control app
permissions. They are separate from profile roles, skills, badges, and other
identity metadata on `profiles`.

## Auth Roles

- `unverified`: default role for self-serve signups before account email
  verification.
- `contributor`: baseline authenticated contributor. Can access the admin UI
  and create draft editorial content.
- `member`: confirmed RaidGuild member. Can view member-only portal content.
- `agent`: automation or trusted agent identity. Can create and publish sourced
  content where collection access allows, and view member-level non-admin portal
  content.
- `editor`: editorial reviewer. Can read, edit, publish, and delete editorial
  content.
- `admin`: system administrator. Can manage users, roles, and all editorial
  content.

Users may have multiple roles. Capabilities are additive.

## Portal Visibility

Portal primitives use these visibility values:

- `public`: visible to anyone when published.
- `authenticated`: visible to any signed-in user when published.
- `member`: visible to signed-in users with `member` or `agent` when published.
- `admin`: visible to `editor` and `admin`.

Draft content is not visible through normal portal reads except to `editor` and
`admin`.

## Post Capabilities

| Capability | Anonymous | Unverified | Contributor | Member | Agent | Editor | Admin |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Read published public posts | yes | yes | yes | yes | yes | yes | yes |
| Read published authenticated posts | no | yes | yes | yes | yes | yes | yes |
| Read published member posts | no | no | no | yes | yes | yes | yes |
| Read admin-only posts | no | no | no | no | no | yes | yes |
| Read drafts | no | no | no | no | no | yes | yes |
| Create post drafts | no | no | yes | no | yes | yes | yes |
| Edit own post drafts | no | no | yes | no | yes | yes | yes |
| Edit any post | no | no | no | no | no | yes | yes |
| Set post visibility | no | no | no | no | yes | yes | yes |
| Publish posts | no | no | no | no | yes | yes | yes |
| Delete posts | no | no | no | no | no | yes | yes |

Contributor-created posts are forced to `draft`, assigned to the creating user
as author, and blocked from publishing. Agents may set visibility and publish
sourced posts by role. Editors and admins remain responsible for deletion and
broad editorial administration.

## Admin UI Access

The Payload admin UI is available to `admin`, `editor`, `contributor`, `member`,
and `agent`. Collection-level and field-level access still controls what each
role can read or change inside the admin UI.

The `users` collection is visible in the admin sidebar only to `editor` and
`admin`. Only `admin` can assign or change auth roles.
