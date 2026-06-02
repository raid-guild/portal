# PR Review Comment Workflow

Use this workflow when an agent is asked to handle GitHub PR review feedback.
It is intentionally generic enough to copy into other repositories.

## Safety

- Do not paste tokens, secrets, private data, or real customer data into chat, logs, commits, tests, or GitHub replies.
- Prefer repository-scoped credentials with the minimum permissions needed.
- Keep authentication local to the machine, for example through `gh`, environment variables, or ignored local files.
- Do not stage, commit, push, comment, or resolve GitHub threads without explicit user approval.

## Flow

1. Fetch all unresolved review threads first.
   - Preserve thread IDs, file paths, line anchors, resolution state, and whether comments are outdated.
   - Avoid relying only on flat comment lists when thread state matters.

2. Summarize the review map before editing.
   - List each actionable thread.
   - For each thread, state what it claims, whether it appears accurate, and the intended action.
   - Separate duplicate, outdated, informational, or ambiguous comments from actionable ones.

3. Validate each comment against the code.
   - Inspect the relevant code and surrounding behavior.
   - Do not assume the reviewer is correct.
   - If the comment is inaccurate, record the reason for the eventual reply.

4. Fix valid comments locally.
   - Keep changes traceable to the review thread.
   - Prefer cohesive local fixes over one commit or push per comment.
   - If a comment conflicts with product intent or another comment, pause and explain the tradeoff.

5. Verify after the selected fixes.
   - Run the smallest useful tests for narrow changes.
   - Run broader checks for shared behavior, schema changes, auth, exports, imports, or UI flow.
   - Record exactly which checks passed or could not be run.

6. Summarize local results to the user.
   - List fixed threads.
   - List intentionally unchanged threads and why.
   - List files changed and verification commands.
   - Ask before staging, committing, pushing, or posting GitHub replies.

7. Reply to GitHub threads only after approval.
   - Reply after code is pushed when a code fix was made.
   - Include the commit SHA or short SHA that contains the fix when one is available.
   - Keep replies concise and specific: what changed, what check supports it, or why it was left unchanged.
   - Leave thread resolution to the user unless they explicitly ask the agent to resolve threads.

## Reply Style

Good replies:

- `Addressed in abc1234 by moving the shared state object out of the server-action file so it only exports async functions. Verified with pnpm typecheck.`
- `Leaving this unchanged: the route intentionally returns 401 before period lookup so unauthenticated requests do not reveal period state.`
- `Partially addressed: the UI now disables the import controls for locked periods, and the server action still enforces the lock as a race-condition guard.`

Avoid:

- exposing secrets, raw financial data, or decrypted identifiers;
- vague replies like `Fixed`;
- resolving threads without the user's permission.
