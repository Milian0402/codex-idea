# codex-idea

A React + Vite + TypeScript prototype that mocks a Codex Plan Mode workflow and shows a deterministic pre-generated implementation picture before any build is approved.

## What this demo does

- Simulates a Plan Mode flow with explicit states:
  - `drafting -> plan_complete -> preview_ready -> approved_simulation`
- Uses a deterministic parser (`parsePlanToPreviewSpec`) to convert plan text into a visual preview spec.
- Renders one generated implementation picture on-screen in a two-pane UI.
- Marks preview output as stale after revise/edit actions until regenerated.
- Runs a fake build simulation timeline after `Approve Build` and ends with `Ready to execute for real`.

## Tech stack

- React 18
- Vite
- TypeScript
- Vitest + Testing Library

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

## Key interfaces

- `PlanSession`: `id`, `userGoal`, `planText`, `status`, `updatedAt`
- `PreviewSpec`: `productName`, `pageTitle`, `layoutSections`, `coreComponents`, `dataBlocks`, `visualTone`
- `GeneratedPreview`: `spec`, `generatedAt`, `sourcePlanHash`
- `BuildSimulationEvent`: `stepId`, `label`, `state`, `timestamp`

## License

MIT
