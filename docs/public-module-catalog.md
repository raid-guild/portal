# Public module catalog

`GET /api/public/modules?page=1` is an anonymous, read-only projection for the
community website gallery. It returns `docs`, `nextPage` (null at the end), and
`totalDocs`, in stable sort-order/ID order, 100 records per page.

Only enabled modules with visibility `public` are included. This does not change
collection read access or signed-launch authentication. The response explicitly
allowlists `id` (slug), `title`, `description`, `category`, `image` (nullable HTTPS
thumbnail), and `href`. No secrets, callbacks, authors, roles, or related records
are serialized. Signed-launch modules link to the Portal detail page.

Responses may be cached for up to five minutes. Removing public visibility can
therefore take up to that cache interval to disappear from a consumer.

Verification: `bun test src/utilities/publicModuleCatalog.test.ts` runs the
standalone projection tests without a database. Also run the normal Portal e2e
suite against an isolated test database.

Deploy the Portal change through staging and human review before deploying the
website consumer. The website uses `/api/artifacts` to fetch the catalog on the
server, and falls back to its selected static collection on an upstream error.
