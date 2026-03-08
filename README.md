# codex-idea

Internal idea repo for Codex App UX concepts. This is intentionally a concept playground and can also be used as a structured notes app for testing product ideas.

## What this repo is (and is not)

- This repository is a **product-idea sandbox**, not a production-ready Codex feature.
- UI flows here are **mock concepts** and may not work well in real-world Codex usage.
- There is **no real Codex execution integration**; outputs are simulated to communicate direction.
- It should be read as an **idea board with runnable demos**, not as a finalized spec.

## Ideas currently in this repo

1. **Plan Preview Studio**
- Goal: reduce long build/rework loops by showing a pre-generated implementation preview before execution.
- What the mock demonstrates:
  - `Simple UI Preview`
  - `Dashboard Preview`
  - `Workflow Preview`
- Key concept features:
  - scenario switcher + reset
  - deterministic preview mapping (`parsePlanToPreviewSpec`)
  - preview explanation (assumptions + mapped components)
  - approval simulation + artifact snapshot
  - deep-link state sharing + artifact export

2. **Codex Multi-Run Split Screens**
- Goal: let users run multiple Codex tasks in parallel while seeing each prompt clearly.
- What the mock demonstrates:
  - 2-4 split panes
  - visible prompt editor per pane
  - per-pane run state and output stream

3. **Session Sidebar With Rich Context**
- Goal: improve thread scanning by adding context beyond title-only rows.
- What the mock demonstrates:
  - Codex-like dark sidebar color modes
  - short description/subtitle under each thread title
  - adjustable thread-title font weight

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
