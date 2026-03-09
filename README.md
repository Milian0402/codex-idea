hi tibo :)

# codex-idea

Internal idea repo for Codex App UX concepts. This is intentionally a concept playground and can also be used as a structured notes app for testing product ideas.

The website is the primary artifact: it is where the static concept pictures and focused mocks are collected into one place.

## What this repo is (and is not)

- This repository is a **product-idea sandbox**, not a production-ready Codex feature.
- UI flows here are **mock concepts** and may not work well in real-world Codex usage.
- There is **no real Codex execution integration**; outputs are simulated to communicate direction.
- It should be read as an **idea board with runnable demos**, not as a finalized spec.

## Ideas currently in this repo

1. **Plan Preview Studio**
- Goal: reduce long build/rework loops by showing the intended implementation picture before execution.
- Website treatment:
  - static picture example using the exact README reference image
  - kept intentionally simple so it reads as an approval step, not as a toy demo

<img width="363" height="634" alt="Plan Preview Studio reference" src="https://github.com/user-attachments/assets/a5adfe0a-0bad-4009-abdc-e4279c0848dc" />

2. **Codex Multi-Run Split Screens**
- Goal: let users run multiple Codex tasks in parallel while seeing each prompt clearly.
- Website treatment:
  - one large split-screen reference instead of visible example panes
  - based on the shared multi-terminal screenshot so the prompts stay easy to read

3. **Chrome-Like Session Tabs**
- Goal: make multiple coding contexts easier to manage and switch between without losing state.
- Website treatment:
  - static picture section using the exact posted side-by-side browser reference
  - focus on keeping the Codex conversation docked next to the active page as a movable QoL view
- Suggested copy:
  - "Add Chrome-like tabs to Codex for moving around chat threads so multiple coding sessions can be organized and switched between more easily."

<img width="1489" height="778" alt="Chrome-Like Session Tabs reference" src="https://github.com/user-attachments/assets/80f578c4-4712-44cb-8853-d837cd867fe5" />

4. **Trusted Repo Auto-Open**
- Goal: skip repetitive repo selection when a trusted repository is already known and let Codex begin scanning immediately.
- Website treatment:
  - static picture section showing an iPhone-style toggle: `Switch on auto scanning when opening`
- Suggested copy:
  - "When opening Codex, if the repository is already trusted and selected, automatically load and start in that repo instead of waiting to prompt."

5. **Phone Emulator Should Be Easier**
- Goal: make quick mobile testing easier to reach from the main Codex workspace.
- Website treatment:
  - static picture section showing a quick-open mobile preview path
- Suggested copy:
  - some things already exist but would be cool to have it inside codex

6. **Session Sidebar With More and features**
- Goal: improve thread scanning by adding context beyond title-only rows.
- Website treatment:
  - Codex-like dark sidebar color modes
  - short description/subtitle under each thread title
  - adjustable thread-title font weight
  - one screenshot reference to show the sidebar treatment

<img width="301" height="561" alt="Screenshot 2026-03-09 at 17 01 26" src="https://github.com/user-attachments/assets/22f7b90c-d3e9-4b20-9dca-0ae1e322f2be" />

7. **Pull Request Company Skills Radar**
- Goal: track pull-request workflow at the team level (not only individual level) and suggest process changes.
- Website treatment:
  - simplified explanation of where the underlying team skill should change
  - short sentences instead of a dense dashboard

8. **Plan Question UX**
- Goal: make plan questions easier to answer by exposing both intent and rationale inline.
- Website treatment:
  - one picture reference
  - one brief explanation of why the second `(i)` matters
  - one screenshot reference for the question helper pattern

<img width="830" height="522" alt="Screenshot 2026-03-09 at 17 02 40" src="https://github.com/user-attachments/assets/e30a2bfb-2831-45bc-bae9-bdfa63a6a1eb" />

9. **Codebase Memory Map (Moat)**
- Goal: let Codex reason from an internal repository map first, instead of repeatedly re-reading files.
- Website treatment:
  - simplified summary cards for symbols, dependencies, and ownership
  - keep `AGENTS.md` short while storing richer repo context elsewhere
- AGENTS.md guidance:
  - keep `AGENTS.md` focused and short (rules/workflows)
  - avoid turning `AGENTS.md` into a large knowledge dump

## Why this format

- Capture hypotheses quickly.
- Compare UX options visually.
- Use the website as the main place where concept pictures are incorporated and reviewed.
- Keep notes on what looks promising vs what fails in practice.

## Tech stack

- React 18
- Vite
- TypeScript
- Vitest + Testing Library
- Playwright (single happy-path e2e script)

## Local preview

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite in your browser.
Usually this is:

```text
http://localhost:5173/
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

## License

MIT
