# codex-idea

Codex Plan Preview Studio: an internal MVP demo that shows a guided "Plan -> Preview -> Approve" workflow before any code is implemented.

## MVP highlights

- Guided demo mode with 3 curated scenarios:
  - `Simple UI Preview`
  - `Dashboard Preview`
  - `Workflow Preview`
- Scenario switcher and reset flow for presenter-friendly replays.
- Deterministic preview generation (`parsePlanToPreviewSpec`) with explicit preview explanation.
- Approval simulation timeline with progress microstates.
- Approval artifact output including:
  - plan hash
  - frozen preview spec snapshot
  - approval timestamp
  - simulation output summary
- Shareability:
  - deep-link state restore via URL `?state=...`
  - artifact JSON export
- Presenter mode toggle (fullscreen-first behavior with local fallback).
- Separate "Codex Multi-Run Split Screens" section:
  - 2-4 concurrent panes
  - visible prompt editor per pane
  - per-pane mock run status and output stream
- Separate "Session Sidebar With Rich Context" section:
  - Codex-like dark sidebar preview modes
  - short thread descriptions in lighter gray beneath titles
  - adjustable thread title weight (regular/medium/semibold)

## Hosted demo URL

GitHub Pages target URL:

- [https://milian0402.github.io/codex-idea/](https://milian0402.github.io/codex-idea/)

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
