import type { DemoScenario } from './types';

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'simple-ui',
    name: 'Simple UI Preview',
    userGoal: 'Preview a clean feature screen before coding so we can approve direction quickly.',
    planText: `# New Feature Mock
Product: Focus Tasks
Screen: Daily Overview
Tone: clean and simple

1. Add a hero section with today's focus summary.
2. Show a compact list of current tasks with status chips.
3. Include one action panel for approve, revise, and archive.
4. Add progress stats with completion and blockers.
5. Keep layout minimal with low visual noise.`,
    expectedTone: 'Clean editorial',
    tags: ['simple', 'quality:high-clarity', 'fast-demo']
  },
  {
    id: 'dashboard-ui',
    name: 'Dashboard Preview',
    userGoal: 'Present a richer dashboard concept to stakeholders before implementation.',
    planText: `# Analytics Surface
Product: Pulse Insights
Screen: Revenue Command Dashboard
Tone: professional enterprise

1. Build a two-column dashboard with KPI hero and trends panel.
2. Add data blocks for monthly revenue, churn risk, and forecast health.
3. Include filter controls for region and owner.
4. Show timeline and activity feed with recent changes.
5. Keep actions visible for approve, revise, and compare.`,
    expectedTone: 'Professional dashboard',
    tags: ['dashboard', 'quality:high-detail', 'stakeholder']
  },
  {
    id: 'workflow-ui',
    name: 'Workflow Preview',
    userGoal: 'Show how a process-heavy workflow could look before any build work starts.',
    planText: `# Workflow Builder Mock
Product: Route Forge
Screen: Automation Flow Workspace
Tone: bold and expressive

1. Render a workflow canvas with input, transform, and output panels.
2. Include timeline steps and validation checklist cards.
3. Surface control buttons for run simulation, revise, and approve.
4. Display live progress signals and event history area.
5. Keep a strong visual hierarchy for decision points.`,
    expectedTone: 'Bold contrast',
    tags: ['workflow', 'quality:high-energy', 'process']
  }
];

export const DEFAULT_SCENARIO_ID = DEMO_SCENARIOS[0].id;

export const getScenarioById = (scenarioId: string): DemoScenario =>
  DEMO_SCENARIOS.find((scenario) => scenario.id === scenarioId) ?? DEMO_SCENARIOS[0];
