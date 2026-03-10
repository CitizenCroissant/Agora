# Safe commit to main

Run the full commit workflow: tests, lint, build, review, then commit to `main` with a conventional message.

## Steps (perform in order)

### 1. Run tests, linters, and build

From the **repository root** (`/workspaces/Agora`):

- Run `npm run test`. If any test fails, **stop** and report the failures; do not proceed to commit until tests pass.
- Run `npm run lint`. If lint fails, **stop** and report the errors; do not proceed until lint passes (fix or tell the user to fix).
- Run `npm run build`. This compiles TypeScript and builds all packages (shared, api, web, etc.) via Turbo. If the build fails (TypeScript errors, compilation errors), **stop** and report; do not proceed until the build succeeds.

### 2. Review for best practices and security

Review **staged** changes (and any unstaged changes that are part of the same work):

- **Best practices**: TypeScript strict usage, no `any`, proper error handling, consistent patterns with the rest of the codebase (see CLAUDE.md and CONTRIBUTING.md).
- **Security**: No hardcoded secrets, API keys, or passwords; no `.env` or `.env.local` content committed; no unsafe `eval`/`Function`/dangerous DOM usage; user input validated/sanitized where relevant.

If you find issues, list them clearly and **do not commit** until the user confirms or fixes them.

### 3. Ensure branch and write commit message

- Confirm the current branch is `main` (run `git branch --show-current`). If not, either switch to `main` with `git checkout main` and re-apply changes, or **warn** the user they are not on `main` and ask before committing.
- Build a **single conventional commit message** from the staged diff:
  - **Format**: `type: subject` (optional body on next line).
  - **Types** (from CONTRIBUTING.md / CLAUDE.md): `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`.
  - **Subject**: imperative, lowercase after the colon, ~50 chars or less (e.g. "add deputy votes endpoint", "fix sitting date parsing").
  - **Body** (optional): wrap at 72 chars if needed; explain what and why, not how.

**Example messages:**

```
feat: add digest subscription API and DB migration
```

```
fix: correct scrutins bill linking for amended texts
```

```
chore: update ingestion deps and README
```

### 4. Commit

- If there are staged changes: run `git commit -m "<message>"` (or `-m "subject" -m "body"` if you use a body). Use the exact message you proposed.
- If nothing is staged: tell the user to stage changes first (`git add ...`) and run this command again.

After committing, confirm: "Committed to main with message: &lt;message&gt;."
