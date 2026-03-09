hi tibo :)

# codex-idea

Internal idea repo for Codex App UX concepts. This is intentionally a concept playground and can also be used as a structured notes app for testing product ideas.

## What this repo is (and is not)

- This repository is a **product-idea sandbox**, not a production-ready Codex feature.
- UI flows here are **mock concepts** and may not work well in real-world Codex usage.
- There is **no real Codex execution integration**; outputs are simulated to communicate direction.
- It should be read as an **idea board with runnable demos**, not as a finalized spec.

## Ideas currently in this repo

1. **Plan Preview With an Image**
- Goal: reduce long build/rework loops by showing a pre-generated implementation preview before execution.
- What the mock demonstrates:
  - `Simple UI Preview`
  - `Dashboard Preview`
  - `Workflow Preview`

Mock picture:
<img width="363" height="634" alt="Screenshot 2026-03-09 at 16 39 19" src="https://github.com/user-attachments/assets/a5adfe0a-0bad-4009-abdc-e4279c0848dc" />



2. **Codex Multi-Run Split Screens**
- Goal: let users run multiple Codex tasks in parallel while seeing each prompt clearly.
- What the mock demonstrates:
  - 2-4 split panes
  - visible prompt editor per pane, quite similar to coding directly in the terminal
  - per-pane run state and output stream

3. **Chrome-Like Session Tabs**
- Goal: make multiple coding contexts easier to manage and switch between without losing state.
- Suggested copy:
  - "For working across multiple coding contexts in Codex, add a tabbed interface similar to Chrome so each task, repo view, or agent session lives in its own tab, making it easier to switch quickly without losing context."
- Short version:
  - "Add Chrome-like tabs to Codex so multiple coding sessions can be organized and switched between more easily."

Like this, where one could drag a chat to make it splitscreen or more
<img width="1489" height="778" alt="Screenshot 2026-03-09 at 16 33 15" src="https://github.com/user-attachments/assets/80f578c4-4712-44cb-8853-d837cd867fe5" />


4. **Trusted Repo Auto-Scan**
- Goal: skip repetitive repo scans when a trusted repository is already known and let Codex begin scanning immediately.
- Suggested copy:
  - "When opening Codex, if the repository is already trusted and selected, automatically load and start in that repo instead of waiting to     prompt. would need user to confirm it before though

5. **Phone Emulator Should Be Easier**
- Suggested copy:
  - some things already exist but would be cool to have it inside codex

6. **Session Sidebar With Rich Context**
- Goal: improve thread scanning by adding context beyond title-only rows.
- What the mock demonstrates:
  - Codex-like dark sidebar color modes
  - short description/subtitle under each thread title
  - adjustable thread-title font weight

7. **Pull Request Company Skills Radar**
- Goal: track pull-request workflow at the team level (not only individual level) and suggest process changes.
- What the mock demonstrates:
  - team-level PR metrics (open PRs, review lag, merged count)
  - shared skill adoption and knowledge spread signals
  - health status per team
  - prioritized suggestions for what to change next based on optimization goal

8. **Plan Question UX**
- Goal: make plan questions easier to answer by exposing both intent and rationale inline.
- What the mock demonstrates:
  - a second `(i)` info affordance in plan questions
  - one tooltip for "what this asks"
  - one tooltip for "why this question"
  - clearer question context before user input

9. **Codebase Memory Map (Moat)**
- Goal: let Codex reason from an internal repository map first, instead of repeatedly re-reading files.
- What the mock demonstrates:
  - indexed symbols, dependencies, ownership, and architecture notes
  - memory-first reasoning path before reopening raw files
  - faster grounding in larger repositories
- AGENTS.md guidance:
  - keep `AGENTS.md` focused and short (rules/workflows)
  - avoid turning `AGENTS.md` into a large knowledge dump

## Why this format

- Capture hypotheses quickly.
- Compare UX options visually.
- Keep notes on what looks promising vs what fails in practice.

## Hosted demo URL

GitHub Pages target URL:

- [https://milian0402.github.io/codex-idea/](https://milian0402.github.io/codex-idea/)

This deployment is for concept review and discussion, not production use.

## Tech stack

- React 18
- Vite
- TypeScript
- Vitest + Testing Library
- Playwright (single happy-path e2e script)

## Run locally

```bash
npm install
npm run dev
```

## Tests

```bash
npm run test
npm run build
```

Optional e2e script:

```bash
npx playwright install chromium
npm run test:e2e
```

## CI and deployment

- CI workflow (`.github/workflows/ci.yml`) runs test + build on push/PR.
- Pages workflow (`.github/workflows/deploy-pages.yml`) builds and deploys `dist` on `main`.

## Public interfaces

- `PlanSession`: `id`, `userGoal`, `planText`, `status`, `updatedAt`
- `PreviewSpec`: `productName`, `pageTitle`, `layoutSections`, `coreComponents`, `dataBlocks`, `visualTone`
- `GeneratedPreview`: `spec`, `generatedAt`, `sourcePlanHash`
- `BuildSimulationEvent`: `stepId`, `label`, `state`, `timestamp`
- `DemoScenario`: `id`, `name`, `userGoal`, `planText`, `expectedTone`, `tags`
- `ApprovalArtifact`: `artifactId`, `sourcePlanHash`, `generatedPreview`, `approvedAt`, `simulationEvents`, `summary`
- `ShareState`: `scenarioId`, `session`, `generatedPreview`, `previewInvalidated`, `artifact?`

## License

MIT
