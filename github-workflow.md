# GITHUB_WORKFLOW.md — SWAROOP collaboration guide (Windows PowerShell)

Repo: https://github.com/Siddhant-git-2909/Swaroop-HackShift
Owner: `Siddhant-git-2909`. Collaborators: `shrajal01`, `Shrey280602` (Shreyas), `utkarshGit635` (Utkarsh Mishra).

Key idea: a Git branch is a snapshot line of the WHOLE project, not a separate folder. Everyone works on their own branch, then merges into the
shared `main` through a pull request (PR). AI agents never run Git write commands; people do, under their own GitHub account.

## Phase A — the owner builds and pushes the baseline (once)
```powershell
git clone https://github.com/Siddhant-git-2909/Swaroop-HackShift.git
cd Swaroop-HackShift
git status
git branch -a
git log --oneline -10
# copy the kit files in, run OpenCode with the MASTER prompt (see RUN_SEQUENCE.md), wait for its final report
git status
git diff --stat
git status --short | Select-String "\.env|uploads|node_modules|\.venv"   # must show nothing except .env.example
git switch -c baseline/mvp
git add .
git commit -m "feat: initial SWAROOP MVP baseline"
```
Review the result (run `npm run setup`, `npm run db:up`, `npm run db:init`, `npm run demo:reset`, `npm test`, `npm run smoke`, `npm run build`). Then:
```powershell
git switch main
git pull origin main
git merge --ff-only baseline/mvp     # if this fails because main moved, run: git merge baseline/mvp and resolve conflicts
git push origin main
```
If `main` is protected, push the branch instead (`git push -u origin baseline/mvp`) and open a PR. If sign-in is requested, use the browser prompt from
Git Credential Manager with your own GitHub account. If a push is rejected because the remote has newer work: `git pull origin main`, resolve
conflicts (below), then push again.

## Phase B — each teammate, first time
```powershell
git clone https://github.com/Siddhant-git-2909/Swaroop-HackShift.git
cd Swaroop-HackShift
git config user.name "Your Name"
git config user.email "your-github-email@example.com"
git config user.name
git config user.email
npm run setup
copy .env.example .env        # edit .env locally; never commit it
npm run db:up
npm run db:init
npm run demo:reset
npm run dev
```
Read `AGENTS.md`, `docs/module-ownership.md` and `docs/api-contracts.md` before coding. Setups differ (Docker, Node, Python versions): fix your own
environment, never edit shared config to suit your machine.

## Every new task: branch, work, commit, push
```powershell
git switch main
git pull origin main
git switch -c feat/worker-passport        # your module's branch name (below)
# ... work, then run the checks ...
npm test
npm run typecheck
git status
git diff
git add server/app/modules/workers client/src/features/worker-onboarding    # add only YOUR paths
git commit -m "feat(worker-onboarding): editable draft with consent step"
git push -u origin feat/worker-passport
```
Branch names: `feat/worker-passport` (Member 1), `feat/backend-bookings` (Member 2), `feat/trust-evidence` (Member 3), `feat/customer-discovery`
(Member 4). Commit message format: `type(scope): what changed`, type is feat, fix, docs, test or refactor. Commit under your own identity only; do not use
another person's identity or make artificial commits.

## Open a pull request
1. After the push, open the repo on GitHub and click "Compare & pull request" (or `gh pr create --base main` if the GitHub CLI is installed).
2. Fill in the PR template: summary, modules touched, shared files touched (yes/no and why), contract changes (API/DB), tests run and results,
   screenshots for UI changes, SIMULATED features affected.
3. Ask the owner of every affected module to review. Merge only after approval and passing CI. Address review comments with new commits on the same branch.

## Keep your branch up to date with main
```powershell
git fetch origin
git status
git merge origin/main
# fix conflicts if any, then:
npm test
git push
```

## If you get a merge conflict
```powershell
git status                      # lists files with conflicts
# open each file, keep the correct lines, delete the <<<<<<< ======= >>>>>>> markers
git add path\to\fixed-file
git commit                      # finishes the merge
npm test
```
If unsure, stop and ask the owner of that file. Never use `git reset --hard`, `git push --force` or `git clean -fd` on shared work.

## Conflict-prevention rules
- Work only in your module. Shared files change only through a PR that the affected owner reviews (list in `PROJECT_STRUCTURE.md` section 5).
- Contract changes (API or database): PR title `contract: ...`; update `docs/api-contracts.md` and `docs/database-schema.md` in the SAME PR; add a NEW
  numbered migration in `db/migrations/` (never edit a merged one); tag the affected owners.
- Pull `main` at the start of every work session and before opening a PR.
- Never commit `.env`, API keys, uploads or `node_modules`.
- No force-push to shared branches without everyone's explicit agreement.
- Conflicts can still happen; the structure only minimises them.

## Final checklist
- [ ] The initial MVP is integrated (worker onboarding -> passport -> evidence -> discovery -> booking -> quotation -> approved change -> completion -> review).
- [ ] `docs/architecture.md`, `module-ownership.md`, `api-contracts.md`, `database-schema.md`, `github-workflow.md` exist and match the code.
- [ ] The app runs locally from the documented Windows commands (`npm run setup`, `db:up`, `db:init`, `demo:reset`, `dev`).
- [ ] `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` and `npm run smoke` pass, including access-control and privacy tests.
- [ ] No `.env` or secrets in the repo; `.env.example` has placeholders only.
- [ ] SIMULATED features are badged in the UI and listed in `docs/integrations-and-limitations.md`.
- [ ] The owner reviewed and pushed the baseline to `main`.
- [ ] Each teammate can clone, branch and work on their module independently.
- [ ] Pull requests are the standard way to integrate, with review before merge.
