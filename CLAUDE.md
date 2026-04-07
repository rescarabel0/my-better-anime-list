# Project Instructions

## UI Components
- ALWAYS use shadcn/ui components. NEVER create custom UI elements from scratch.
- If a needed shadcn component doesn't exist in the project yet, add it using the shadcn CLI (`npx shadcn@latest add <component>`).
- This project uses `@base-ui/react` as the shadcn primitive layer (not Radix).

## Git & Commits
- Commit automatically when you finish a task (feat, fix, refactor, etc.) without waiting for the user to ask.
- Use **Conventional Commits** format: `feat:`, `fix:`, `refactor:`, `docs:`, `build:`, `chore:`, `style:`, `perf:`, `test:`.
- Always include `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>` in the commit message.

### Before committing, always:
1. Run `pnpm build` to ensure there are no TypeScript or build errors.
2. Review staged changes with `git diff --cached` — check for:
   - Secrets, API keys, tokens, or credentials accidentally included.
   - `.env` files or sensitive config that should not be committed.
   - Debug code (`console.log`, `debugger`, etc.) left behind.
   - Unused imports or dead code introduced by the change.
3. Only stage files relevant to the current change — avoid `git add .` or `git add -A`.
4. Do NOT push to remote unless the user explicitly asks.

## Releases
- The project uses `standard-version` for semantic versioning.
- To create a release: `pnpm release` then `git push --follow-tags origin main`.
- Only run releases when the user asks.
