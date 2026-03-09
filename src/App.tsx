import { useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_SCENARIO_ID, DEMO_SCENARIOS, getScenarioById } from './demoScenarios';
import { buildApprovalArtifact } from './lib/artifact';
import { hashPlanText } from './lib/hash';
import { getViewportMode } from './lib/layout';
import { isPreviewStale, parsePlanToPreviewSpec } from './lib/planParser';
import { deserializeShareState, serializeShareState } from './lib/shareState';
import contextualThreadsShot from './assets/contextual-threads.png';
import infoBubbleHelperShot from './assets/info-bubble-helper.png';
import phoneEmulatorQuickOpenShot from './assets/phone-emulator-quick-open.png';
import planPreviewStudioShot from './assets/plan-preview-studio.png';
import sessionTabsShot from './assets/session-tabs.png';
import splitScreenTerminalStudyShot from './assets/split-screen-terminal-study.svg';
import trustedRepoAutoOpenShot from './assets/trusted-repo-auto-open.png';
import type {
  ApprovalArtifact,
  BuildSimulationEvent,
  DemoScenario,
  GeneratedPreview,
  PlanSession,
  PlanStatus,
  PreviewSpec,
  ShareState
} from './types';

const SIMULATION_STEPS = [
  { stepId: 'lock-plan', label: 'Locking approved plan snapshot' },
  { stepId: 'map-ui', label: 'Mapping UI components to build intent' },
  { stepId: 'validate', label: 'Running deterministic safety checks' },
  { stepId: 'stage', label: 'Staging implementation packets' },
  { stepId: 'ready', label: 'Ready to execute for real' }
] as const;

const MIN_PLAN_LENGTH = 40;
const DEFAULT_SPLIT_PANE_COUNT = 3;
const MAX_SPLIT_PANE_COUNT = 4;

type PreviewGenerationState = 'idle' | 'generating' | 'ready' | 'error';
type SplitPaneRunState = 'idle' | 'running' | 'done';
type SidebarThemeMode = 'terminal' | 'slate' | 'graphite';
type SidebarTitleWeight = 'regular' | 'medium' | 'semibold';
type SkillsFocus = 'delivery' | 'quality' | 'balance';
type IdeaSectionId =
  | 'plan-preview'
  | 'split-screens'
  | 'session-tabs'
  | 'trusted-repo'
  | 'phone-emulator'
  | 'session-sidebar'
  | 'pull-request-radar'
  | 'plan-question'
  | 'memory-map';
type MemoryMapLens = 'architecture' | 'ownership' | 'dependencies';

interface PreviewExplanation {
  assumptions: string[];
  mappedComponents: string[];
  rationale: string;
}

interface SplitPane {
  id: string;
  title: string;
  prompt: string;
  state: SplitPaneRunState;
  log: string[];
}

interface SplitScreenVisualStudy {
  id: string;
  eyebrow: string;
  title: string;
  summary: string;
  imageSrc: string;
  imageAlt: string;
  bullets: string[];
}

interface SessionThread {
  id: string;
  title: string;
  description: string;
  updated: string;
}

interface SidebarWorkspace {
  id: string;
  name: string;
  threads: SessionThread[];
}

interface TeamSkillsSnapshot {
  id: string;
  name: string;
  openPullRequests: number;
  mergedThisWeek: number;
  avgReviewLagHours: number;
  knowledgeSpread: number;
  sharedSkillAdoption: number;
  defectReopenRate: number;
}

interface PullRequestSuggestion {
  id: string;
  priority: 'high' | 'medium';
  text: string;
}

interface IdeaShowcase {
  id: IdeaSectionId;
  title: string;
  eyebrow: string;
  summary: string;
  format: 'program' | 'mock' | 'picture';
  highlight: string;
}

interface PlanQuestionPreviewSample {
  id: string;
  label: string;
  question: string;
  whatHelp: string;
  whyHelp: string;
  exampleAnswer: string;
}

interface MemoryMapCluster {
  id: string;
  label: string;
  owner: string;
  symbolCount: number;
  dependencyRisk: 'low' | 'medium' | 'high';
  architectureNote: string;
  ownershipNote: string;
  dependencyNote: string;
  symbols: string[];
}

interface FeatureCapture {
  id: string;
  title: string;
  summary: string;
  imageSrc: string;
  imageAlt: string;
  repoUrl: string;
  sectionId: IdeaSectionId;
}

interface StaticPictureIdea {
  id: IdeaSectionId;
  title: string;
  eyebrow: string;
  summary: string;
  note: string;
  imageSrc: string;
  imageAlt: string;
  cardTitle: string;
  cardBody: string;
  bullets: string[];
  linkLabel?: string;
  linkHref?: string;
}

interface BootstrapState {
  scenarioId: string;
  session: PlanSession;
  generatedPreview: GeneratedPreview | null;
  previewInvalidated: boolean;
  artifact: ApprovalArtifact | null;
  simulationEvents: BuildSimulationEvent[];
}

const SPLIT_PANE_LIBRARY = [
  {
    title: 'Feature Build Lane',
    prompt:
      'Implement a profile settings page with clear save states and inline validation. Show each changed file before writing code.'
  },
  {
    title: 'Refactor Lane',
    prompt:
      'Refactor duplicated API helpers into a shared client module and summarize migration impact before edits.'
  },
  {
    title: 'Test Lane',
    prompt:
      'Add integration tests for approval flow and surface failing assertions with minimal repro steps.'
  },
  {
    title: 'Debug Lane',
    prompt:
      'Investigate intermittent timeout in simulation sequence and provide likely root cause before patching.'
  }
] as const;

const SIDEBAR_WORKSPACES: SidebarWorkspace[] = [
  {
    id: 'steinberger-scripts',
    name: 'steinberger-scripts',
    threads: [
      {
        id: 'thread-oracle-update',
        title: 'Assess oracle subskill update need',
        description: 'Review scope mismatch in oracle prompts and suggest a lower-friction update path.',
        updated: '2d'
      }
    ]
  },
  {
    id: 'meal_planner',
    name: 'meal_planner',
    threads: [
      {
        id: 'thread-predictive-planner',
        title: 'Build predictive meal planner',
        description: 'Prototype recommendation cards and evaluate weekly plan confidence signals.',
        updated: '3d'
      }
    ]
  },
  {
    id: 'code',
    name: 'code',
    threads: [
      {
        id: 'thread-codex-idea',
        title: 'Initialize codex-idea folder',
        description: 'Created MVP concept repo and scaffolded demo flow before implementation.',
        updated: '58m'
      },
      {
        id: 'thread-mit-license',
        title: 'Add MIT license to poker-ideal-move',
        description: 'Applied standard MIT text and verified repository license metadata.',
        updated: '46m'
      },
      {
        id: 'thread-gogcli',
        title: 'Set up gogcli from GitHub',
        description: 'Cloned and prepared local environment with CLI auth pre-checks.',
        updated: '17h'
      },
      {
        id: 'thread-codexbar',
        title: 'Verify CodexBar auto update',
        description: 'Checked update channel behavior and confirmed trigger conditions.',
        updated: '17h'
      },
      {
        id: 'thread-poker-app',
        title: 'Build poker app for ideal moves',
        description: 'Outlined UI state transitions and result visualization patterns.',
        updated: '17h'
      }
    ]
  },
  {
    id: 'triverge-app',
    name: 'triverge-app',
    threads: [
      {
        id: 'thread-review-prs',
        title: 'Review PR 265 266 using Legend',
        description: 'Summarize regressions by severity and map required follow-up tests.',
        updated: '22h'
      }
    ]
  }
];

const TEAM_SKILLS_SNAPSHOTS: TeamSkillsSnapshot[] = [
  {
    id: 'platform',
    name: 'Platform',
    openPullRequests: 14,
    mergedThisWeek: 21,
    avgReviewLagHours: 31,
    knowledgeSpread: 46,
    sharedSkillAdoption: 54,
    defectReopenRate: 8
  },
  {
    id: 'growth',
    name: 'Growth',
    openPullRequests: 9,
    mergedThisWeek: 28,
    avgReviewLagHours: 18,
    knowledgeSpread: 62,
    sharedSkillAdoption: 67,
    defectReopenRate: 11
  },
  {
    id: 'core-product',
    name: 'Core Product',
    openPullRequests: 7,
    mergedThisWeek: 17,
    avgReviewLagHours: 16,
    knowledgeSpread: 73,
    sharedSkillAdoption: 79,
    defectReopenRate: 6
  }
];

const DEFAULT_TEAM_SKILLS_ID = TEAM_SKILLS_SNAPSHOTS[0].id;
const IDEA_SHOWCASES: IdeaShowcase[] = [
  {
    id: 'plan-preview',
    title: 'Plan Preview Studio',
    eyebrow: 'Pre-build visual approval',
    summary: 'Show one fixed implementation picture and approval artifact flow before code execution starts.',
    format: 'picture',
    highlight: 'Static visual reference for plan approval'
  },
  {
    id: 'split-screens',
    title: 'Multi-Run Split Screens',
    eyebrow: 'Parallel Codex panes',
    summary: 'Browse 2-4 side-by-side Codex runs with visible prompts and output streams.',
    format: 'program',
    highlight: 'Parallel task visibility'
  },
  {
    id: 'session-tabs',
    title: 'Chrome-Like Session Tabs',
    eyebrow: 'Tabbed session switching',
    summary: 'Keep multiple repo and task contexts open in tabs so Codex work does not reset on every switch.',
    format: 'picture',
    highlight: 'Fast context switching without losing state'
  },
  {
    id: 'trusted-repo',
    title: 'Trusted Repo Auto-Open',
    eyebrow: 'Known repo startup shortcut',
    summary: 'Open the trusted repository directly and start scanning instead of stopping at repo selection.',
    format: 'picture',
    highlight: 'Skip repetitive startup friction'
  },
  {
    id: 'phone-emulator',
    title: 'Phone Emulator Should Be Easier',
    eyebrow: 'Faster mobile testing',
    summary: 'Surface mobile preview sooner so quick responsive checks do not feel hidden behind setup steps.',
    format: 'picture',
    highlight: 'Bring mobile preview closer to the main workflow'
  },
  {
    id: 'session-sidebar',
    title: 'Rich Session Sidebar',
    eyebrow: 'Thread context and style',
    summary: 'Explore subtitles, context, theme modes, and title-weight controls in one sidebar mock.',
    format: 'mock',
    highlight: 'Higher-signal thread scanning'
  },
  {
    id: 'pull-request-radar',
    title: 'Pull Request Company Skills Radar',
    eyebrow: 'Team-level PR health',
    summary: 'Track pull request flow by team and surface prioritized improvement suggestions.',
    format: 'program',
    highlight: 'Team metrics instead of individual-only metrics'
  },
  {
    id: 'plan-question',
    title: 'Plan Question UX',
    eyebrow: 'Two-info-button prompt design',
    summary: 'Show both what a plan question asks and why the question exists before a user answers.',
    format: 'mock',
    highlight: 'Separate intent from rationale'
  },
  {
    id: 'memory-map',
    title: 'Codebase Memory Map',
    eyebrow: 'Internal repo moat',
    summary: 'Model symbols, dependencies, ownership, and architecture notes so Codex reasons from a repo map first.',
    format: 'picture',
    highlight: 'Keep AGENTS.md short and operational'
  }
];
const DEFAULT_ACTIVE_IDEA_ID: IdeaSectionId = IDEA_SHOWCASES[0].id;

const IDEA_SECTION_DOM_IDS: Record<IdeaSectionId, string> = {
  'plan-preview': 'idea-plan-preview',
  'split-screens': 'idea-split-screens',
  'session-tabs': 'idea-session-tabs',
  'trusted-repo': 'idea-trusted-repo',
  'phone-emulator': 'idea-phone-emulator',
  'session-sidebar': 'idea-session-sidebar',
  'pull-request-radar': 'idea-pull-request-radar',
  'plan-question': 'idea-plan-question',
  'memory-map': 'idea-memory-map'
};

const PLAN_QUESTION_PREVIEW_SAMPLES: PlanQuestionPreviewSample[] = [
  {
    id: 'implementation-slice',
    label: 'Implementation slice',
    question: 'What is the first shippable slice Codex should build from this request?',
    whatHelp: 'This asks for the smallest concrete build target so the mock can preview a realistic first delivery.',
    whyHelp: 'Splitting the ask into a first slice reduces vague plans and makes approval discussions much faster.',
    exampleAnswer: 'Start with a landing page plus one interactive concept panel before secondary tooling.'
  },
  {
    id: 'review-risk',
    label: 'Review risk',
    question: 'Which unknowns would make you hesitate to approve this plan today?',
    whatHelp: 'This asks for blockers, hidden assumptions, or missing information in the plan.',
    whyHelp: 'Teams need to see risk separately from scope so Codex can clarify before work starts, not after.',
    exampleAnswer: 'Ownership of the repo area is unclear, and the visual success criteria need one concrete example.'
  },
  {
    id: 'success-signal',
    label: 'Success signal',
    question: 'What would make this implementation feel obviously successful in the first demo?',
    whatHelp: 'This asks for the most important outcome signal to optimize the first preview around.',
    whyHelp: 'A success signal anchors the preview to one visible outcome instead of trying to solve everything at once.',
    exampleAnswer: 'The landing page should make each idea instantly understandable and openable within one click.'
  }
];

const DEFAULT_PLAN_QUESTION_PREVIEW_ID = PLAN_QUESTION_PREVIEW_SAMPLES[0].id;

const MEMORY_MAP_CLUSTERS: MemoryMapCluster[] = [
  {
    id: 'entry-surfaces',
    label: 'Entry Surfaces',
    owner: 'Product Design',
    symbolCount: 18,
    dependencyRisk: 'low',
    architectureNote: 'Landing views, concept cards, and navigation anchors define how people enter and browse the idea space.',
    ownershipNote: 'This area benefits from shared ownership between product design and frontend maintainers because layout decisions shape every concept.',
    dependencyNote: 'Coupling stays low when entry surfaces depend on small UI primitives instead of feature-specific business logic.',
    symbols: ['App', 'PreviewCanvas', 'idea navigation', 'presenter mode']
  },
  {
    id: 'plan-engine',
    label: 'Plan Engine',
    owner: 'Agent Platform',
    symbolCount: 27,
    dependencyRisk: 'medium',
    architectureNote: 'Plan parsing, preview generation, hashing, and artifact simulation form the deterministic reasoning core.',
    ownershipNote: 'A narrow owner group speeds changes here, but the map exposes bus-factor risk when plan logic sits with too few people.',
    dependencyNote: 'This cluster depends on parsing and serialization utilities, so hidden cross-module coupling is the main regression risk.',
    symbols: ['parsePlanToPreviewSpec', 'hashPlanText', 'buildApprovalArtifact', 'serializeShareState']
  },
  {
    id: 'collaboration-signals',
    label: 'Collaboration Signals',
    owner: 'Developer Experience',
    symbolCount: 21,
    dependencyRisk: 'medium',
    architectureNote: 'Sidebar context, plan-question UX, and multi-run orchestration all support human review and coordination loops.',
    ownershipNote: 'Ownership is healthiest when product, DX, and design each own one layer instead of one team carrying every interaction.',
    dependencyNote: 'Interaction-heavy concept mocks usually depend on shared state more than external services, so state sprawl is the watch item.',
    symbols: ['split panes', 'thread sidebar', 'question help', 'team radar']
  },
  {
    id: 'delivery-signals',
    label: 'Delivery Signals',
    owner: 'Engineering Productivity',
    symbolCount: 14,
    dependencyRisk: 'high',
    architectureNote: 'Review lag, reopen rate, knowledge spread, and skill adoption are the signals that turn ideas into team-level operations.',
    ownershipNote: 'These signals should not live only in one team dashboard because they affect company-wide merge throughput.',
    dependencyNote: 'Metrics layers tend to sprawl across APIs and reporting jobs, so dependency drift is highest in this cluster.',
    symbols: ['review lag', 'knowledge spread', 'shared skill adoption', 'defect reopen rate']
  }
];

const DEFAULT_MEMORY_MAP_CLUSTER_ID = MEMORY_MAP_CLUSTERS[0].id;

const FEATURE_CAPTURES: FeatureCapture[] = [
  {
    id: 'contextual-threads',
    title: 'Contextual Threads',
    summary: 'Screenshot captured from the linked repo to show the richer session sidebar concept in a more product-like state.',
    imageSrc: contextualThreadsShot,
    imageAlt: 'Screenshot of the contextual threads repo showing a dark session sidebar next to a conversation view.',
    repoUrl: 'https://github.com/Milian0402/contextual-threads',
    sectionId: 'session-sidebar'
  },
  {
    id: 'info-bubble-helper',
    title: 'Info Bubble Helper',
    summary: 'Screenshot captured from the linked repo to show the two-layer plan question helper with the info bubble visible.',
    imageSrc: infoBubbleHelperShot,
    imageAlt: 'Screenshot of the info bubble helper repo showing a question card with an explanatory info tooltip.',
    repoUrl: 'https://github.com/Milian0402/info-bubble-helper',
    sectionId: 'plan-question'
  }
];

const STATIC_PICTURE_IDEAS: StaticPictureIdea[] = [
  {
    id: 'session-tabs',
    title: 'Chrome-Like Session Tabs',
    eyebrow: 'README Picture Concept',
    summary: 'Make multiple coding contexts easier to manage and switch between without losing state.',
    note: 'Dock the active Codex conversation next to the page you are working on.',
    imageSrc: sessionTabsShot,
    imageAlt: 'Static concept image showing a dark chat window docked beside a live webpage, like a movable browser-level Codex session.',
    cardTitle: 'Dockable side-by-side session view',
    cardBody:
      'Keep the active Codex session beside the page or app you are working on, then move that split around as a small quality-of-life improvement instead of reopening context.',
    bullets: [
      'Keep the conversation visible beside the live page you are editing.',
      'Let the split feel movable or dockable like a browser-level utility.',
      'Reduce re-orientation cost without turning the workflow into full window juggling.'
    ],
    linkLabel: 'Read the related product reference',
    linkHref: 'https://openai.com/index/introducing-the-codex-app/'
  },
  {
    id: 'trusted-repo',
    title: 'Trusted Repo Auto-Open',
    eyebrow: 'README Picture Concept',
    summary: 'Skip repetitive repo selection when a trusted repository is already known.',
    note: 'Known repository, faster startup.',
    imageSrc: trustedRepoAutoOpenShot,
    imageAlt: 'Static concept image showing a phone-style startup toggle labeled Switch on auto scanning when opening.',
    cardTitle: 'One startup toggle',
    cardBody:
      'Treat this as one simple preference: switch on auto scanning when opening a trusted repo.',
    bullets: [
      'Remove the extra chooser step when trust is already established.',
      'Start scanning and indexing immediately after launch.',
      'Turn startup into a continuation of work instead of another setup loop.'
    ]
  },
  {
    id: 'phone-emulator',
    title: 'Phone Emulator Should Be Easier',
    eyebrow: 'README Picture Concept',
    summary: 'Make the existing phone emulator faster to reach for quick mobile checks.',
    note: 'Quick-open mobile preview from the main workspace.',
    imageSrc: phoneEmulatorQuickOpenShot,
    imageAlt: 'Static concept image showing a main Codex workspace with a quick-open control that reveals a phone emulator preview.',
    cardTitle: 'Expose mobile preview as a first-class shortcut',
    cardBody:
      'The phone emulator is already useful, but it should be a near-immediate action from the main UI instead of feeling buried.',
    bullets: [
      'Add a visible mobile-preview entry point in the primary workspace.',
      'Reduce the steps required for fast responsive checks.',
      'Keep the emulator close enough that quick validation becomes routine.'
    ]
  }
];

const MEMORY_MAP_LENS_COPY: Record<MemoryMapLens, string> = {
  architecture: 'See the repo as connected subsystems before reopening raw files.',
  ownership: 'Surface who should review and where bus-factor risk is hiding.',
  dependencies: 'Expose risky coupling so Codex can plan edits without rediscovering imports repeatedly.'
};

const buildSplitPanes = (count: number): SplitPane[] =>
  SPLIT_PANE_LIBRARY.slice(0, count).map((item, index) => ({
    id: `split-pane-${index + 1}`,
    title: item.title,
    prompt: item.prompt,
    state: 'idle',
    log: []
  }));

const resizeSplitPanes = (current: SplitPane[], count: number): SplitPane[] => {
  const next = buildSplitPanes(count);

  return next.map((pane, index) => {
    const existing = current[index];
    if (!existing) {
      return pane;
    }

    return {
      ...pane,
      prompt: existing.prompt,
      state: existing.state,
      log: existing.log
    };
  });
};

const splitPaneStateLabel = (state: SplitPaneRunState): string => {
  if (state === 'running') {
    return 'Running';
  }

  if (state === 'done') {
    return 'Done';
  }

  return 'Idle';
};

const SPLIT_SCREEN_VISUAL_STUDIES: SplitScreenVisualStudy[] = [
  {
    id: 'terminal-study',
    eyebrow: 'Split-Screen Reference',
    title: 'Codex split-screen reference',
    summary: 'One clear reference based on the shared multi-terminal screenshot, with visible prompts and outputs side by side.',
    imageSrc: splitScreenTerminalStudyShot,
    imageAlt: 'Terminal layout study inspired by a multi-terminal Codex screenshot, showing three dark panes with visible prompts and responses.',
    bullets: []
  }
];

const isPlanStatus = (value: unknown): value is PlanStatus =>
  value === 'drafting' || value === 'plan_complete' || value === 'preview_ready' || value === 'approved_simulation';

const createSessionFromScenario = (scenario: DemoScenario): PlanSession => ({
  id: `scenario-${scenario.id}`,
  userGoal: scenario.userGoal,
  planText: scenario.planText,
  status: 'drafting',
  updatedAt: new Date().toISOString()
});

const normalizeSession = (value: unknown, fallback: PlanSession): PlanSession => {
  if (typeof value !== 'object' || value === null) {
    return fallback;
  }

  const raw = value as Partial<PlanSession>;

  return {
    id: typeof raw.id === 'string' ? raw.id : fallback.id,
    userGoal: typeof raw.userGoal === 'string' ? raw.userGoal : fallback.userGoal,
    planText: typeof raw.planText === 'string' ? raw.planText : fallback.planText,
    status: isPlanStatus(raw.status) ? raw.status : fallback.status,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : fallback.updatedAt
  };
};

const createBootstrapState = (): BootstrapState => {
  const defaultScenario = getScenarioById(DEFAULT_SCENARIO_ID);
  const fallbackSession = createSessionFromScenario(defaultScenario);

  if (typeof window === 'undefined') {
    return {
      scenarioId: defaultScenario.id,
      session: fallbackSession,
      generatedPreview: null,
      previewInvalidated: false,
      artifact: null,
      simulationEvents: []
    };
  }

  const encodedState = new URLSearchParams(window.location.search).get('state');
  if (!encodedState) {
    return {
      scenarioId: defaultScenario.id,
      session: fallbackSession,
      generatedPreview: null,
      previewInvalidated: false,
      artifact: null,
      simulationEvents: []
    };
  }

  const restored = deserializeShareState(encodedState);
  if (!restored) {
    return {
      scenarioId: defaultScenario.id,
      session: fallbackSession,
      generatedPreview: null,
      previewInvalidated: false,
      artifact: null,
      simulationEvents: []
    };
  }

  const scenario = getScenarioById(restored.scenarioId);
  const session = normalizeSession(restored.session, createSessionFromScenario(scenario));
  const generatedPreview = restored.generatedPreview ?? null;
  const artifact = restored.artifact ?? null;

  return {
    scenarioId: scenario.id,
    session,
    generatedPreview,
    previewInvalidated: Boolean(restored.previewInvalidated),
    artifact,
    simulationEvents: artifact?.simulationEvents ?? []
  };
};

const statusLabel = (status: PlanStatus): string =>
  status
    .split('_')
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');

const toneClassFor = (tone: string): string => {
  const normalized = tone.toLowerCase();

  if (normalized.includes('bold')) {
    return 'tone-bold';
  }

  if (normalized.includes('clean')) {
    return 'tone-clean';
  }

  if (normalized.includes('professional')) {
    return 'tone-pro';
  }

  return 'tone-future';
};

const qualityLabelFromTags = (scenario: DemoScenario): string => {
  const qualityTag = scenario.tags.find((tag) => tag.startsWith('quality:'));
  if (!qualityTag) {
    return 'balanced';
  }

  return qualityTag.replace('quality:', '').replace(/-/g, ' ');
};

const getIdeaSectionIdFromHash = (hash: string): IdeaSectionId | null => {
  const normalizedHash = hash.replace(/^#/, '');
  const matchingEntry = Object.entries(IDEA_SECTION_DOM_IDS).find(([, sectionId]) => sectionId === normalizedHash);

  return matchingEntry ? (matchingEntry[0] as IdeaSectionId) : null;
};

const createInitialIdeaSelection = (): IdeaSectionId => {
  if (typeof window === 'undefined') {
    return DEFAULT_ACTIVE_IDEA_ID;
  }

  return getIdeaSectionIdFromHash(window.location.hash) ?? DEFAULT_ACTIVE_IDEA_ID;
};

const getPlanQuestionPreviewSample = (sampleId: string): PlanQuestionPreviewSample =>
  PLAN_QUESTION_PREVIEW_SAMPLES.find((sample) => sample.id === sampleId) ?? PLAN_QUESTION_PREVIEW_SAMPLES[0];

const getMemoryMapCluster = (clusterId: string): MemoryMapCluster =>
  MEMORY_MAP_CLUSTERS.find((cluster) => cluster.id === clusterId) ?? MEMORY_MAP_CLUSTERS[0];

const getTeamSnapshot = (teamId: string): TeamSkillsSnapshot =>
  TEAM_SKILLS_SNAPSHOTS.find((team) => team.id === teamId) ?? TEAM_SKILLS_SNAPSHOTS[0];

const teamHealthLabel = (team: TeamSkillsSnapshot): string => {
  if (team.avgReviewLagHours > 24 || team.knowledgeSpread < 55) {
    return 'Needs attention';
  }

  if (team.defectReopenRate > 10 || team.sharedSkillAdoption < 65) {
    return 'Watch closely';
  }

  return 'Healthy';
};

const buildPullRequestSuggestions = (team: TeamSkillsSnapshot, focus: SkillsFocus): PullRequestSuggestion[] => {
  const suggestions: PullRequestSuggestion[] = [];

  if (team.avgReviewLagHours > 24) {
    suggestions.push({
      id: `${team.id}-review-lag`,
      priority: 'high',
      text: `Average review lag is ${team.avgReviewLagHours}h. Add a rotating reviewer slot each day to unblock queued pull requests faster.`
    });
  }

  if (team.knowledgeSpread < 60) {
    suggestions.push({
      id: `${team.id}-spread`,
      priority: 'high',
      text: `Knowledge spread is ${team.knowledgeSpread}%. Require one cross-team reviewer on high-impact pull requests to avoid single-owner bottlenecks.`
    });
  }

  if (focus === 'delivery' && team.openPullRequests > 10) {
    suggestions.push({
      id: `${team.id}-delivery`,
      priority: 'medium',
      text: `Open pull requests are high (${team.openPullRequests}). Encourage smaller PR slices with a max review scope so teams merge sooner.`
    });
  }

  if (focus === 'quality' && team.defectReopenRate > 9) {
    suggestions.push({
      id: `${team.id}-quality`,
      priority: 'high',
      text: `Defect reopen rate is ${team.defectReopenRate}%. Add a release-risk checklist to pull request templates for this team.`
    });
  }

  if (focus === 'balance' && team.mergedThisWeek > 0) {
    suggestions.push({
      id: `${team.id}-balance`,
      priority: 'medium',
      text: `Keep delivery and quality balanced by reserving one weekly pull request retro where teams compare review lag, adoption, and reopen trends.`
    });
  }

  if (team.sharedSkillAdoption < 70) {
    suggestions.push({
      id: `${team.id}-skills`,
      priority: 'medium',
      text: `Shared skill adoption is ${team.sharedSkillAdoption}%. Publish a single company skill template and require it for new automation-heavy pull requests.`
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      id: `${team.id}-steady-state`,
      priority: 'medium',
      text: `Current pull request patterns are stable. Keep the same review policy and monitor team metrics weekly for drift.`
    });
  }

  return suggestions.slice(0, 3);
};

const buildPreviewExplanation = (planText: string, spec: PreviewSpec, scenario: DemoScenario): PreviewExplanation => {
  const assumptions = [
    `Expected tone is ${scenario.expectedTone} based on the selected scenario.`,
    `Primary page inferred as ${spec.pageTitle}.`,
    `Layout focus includes ${spec.layoutSections.slice(0, 2).join(' and ')}.`
  ];

  const mappedComponents = [...spec.coreComponents, ...spec.dataBlocks].slice(0, 6);
  const rationale = `Parsed ${planText.split('\n').filter(Boolean).length} plan lines and mapped deterministic component groups from tags and keywords.`;

  return {
    assumptions,
    mappedComponents,
    rationale
  };
};

const buildShareUrl = (state: ShareState): string => {
  if (typeof window === 'undefined') {
    return '';
  }

  const token = serializeShareState(state);
  return `${window.location.origin}${window.location.pathname}?state=${token}`;
};

const memoryMapRiskLabel = (risk: MemoryMapCluster['dependencyRisk']): string =>
  risk.charAt(0).toUpperCase() + risk.slice(1);

const memoryMapLensNarrative = (cluster: MemoryMapCluster, lens: MemoryMapLens): string => {
  if (lens === 'ownership') {
    return cluster.ownershipNote;
  }

  if (lens === 'dependencies') {
    return cluster.dependencyNote;
  }

  return cluster.architectureNote;
};

const updateStatus = (session: PlanSession, status: PlanStatus): PlanSession => ({
  ...session,
  status,
  updatedAt: new Date().toISOString()
});

const PreviewCanvas = ({ spec }: { spec: PreviewSpec }) => (
  <article className={`preview-canvas ${toneClassFor(spec.visualTone)}`} aria-label="Generated implementation preview">
    <header className="preview-canvas__header">
      <div>
        <p className="eyebrow">Proposed Product</p>
        <h3>{spec.productName}</h3>
      </div>
      <span className="tone-pill">{spec.visualTone}</span>
    </header>

    <section className="preview-hero">
      <h4>{spec.pageTitle}</h4>
      <p>Generated from plan intent. This visual represents what Codex would build after approval.</p>
    </section>

    <section className="preview-grid">
      {spec.layoutSections.map((section) => (
        <div key={section} className="preview-block">
          <p className="eyebrow">Layout Section</p>
          <strong>{section}</strong>
        </div>
      ))}
    </section>

    <section className="chip-strip">
      {spec.coreComponents.map((component) => (
        <span key={component} className="chip">
          {component}
        </span>
      ))}
    </section>

    <section className="data-strip">
      {spec.dataBlocks.map((block) => (
        <div key={block} className="metric-card">
          <p>{block}</p>
          <strong>{Math.abs(hashPlanText(block).charCodeAt(0) % 90) + 10}%</strong>
        </div>
      ))}
    </section>
  </article>
);

export default function App() {
  const bootstrapRef = useRef<BootstrapState | null>(null);
  if (!bootstrapRef.current) {
    bootstrapRef.current = createBootstrapState();
  }

  const bootstrapState = bootstrapRef.current as BootstrapState;

  const [scenarioId, setScenarioId] = useState(bootstrapState.scenarioId);
  const [session, setSession] = useState<PlanSession>(bootstrapState.session);
  const [generatedPreview, setGeneratedPreview] = useState<GeneratedPreview | null>(bootstrapState.generatedPreview);
  const [previewInvalidated, setPreviewInvalidated] = useState(bootstrapState.previewInvalidated);
  const [simulationEvents, setSimulationEvents] = useState<BuildSimulationEvent[]>(bootstrapState.simulationEvents);
  const [artifact, setArtifact] = useState<ApprovalArtifact | null>(bootstrapState.artifact);
  const [viewportMode, setViewportMode] = useState(() => getViewportMode(window.innerWidth));
  const [previewGenerationState, setPreviewGenerationState] = useState<PreviewGenerationState>('idle');
  const [planError, setPlanError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [showPlanQuestionInfo, setShowPlanQuestionInfo] = useState(false);
  const [showPlanWhyInfo, setShowPlanWhyInfo] = useState(false);
  const [shareMessage, setShareMessage] = useState<string>('');
  const [presenterMode, setPresenterMode] = useState(false);
  const [sidebarThemeMode, setSidebarThemeMode] = useState<SidebarThemeMode>('terminal');
  const [sidebarTitleWeight, setSidebarTitleWeight] = useState<SidebarTitleWeight>('medium');
  const [showThreadDescriptions, setShowThreadDescriptions] = useState(true);
  const [selectedThreadId, setSelectedThreadId] = useState('thread-codex-idea');
  const [selectedTeamId, setSelectedTeamId] = useState(DEFAULT_TEAM_SKILLS_ID);
  const [skillsFocus, setSkillsFocus] = useState<SkillsFocus>('balance');
  const [splitPaneCount, setSplitPaneCount] = useState(DEFAULT_SPLIT_PANE_COUNT);
  const [splitPanes, setSplitPanes] = useState<SplitPane[]>(() => buildSplitPanes(DEFAULT_SPLIT_PANE_COUNT));
  const [activeIdeaId, setActiveIdeaId] = useState<IdeaSectionId>(() => createInitialIdeaSelection());
  const [planQuestionPreviewId, setPlanQuestionPreviewId] = useState(DEFAULT_PLAN_QUESTION_PREVIEW_ID);
  const [showPlanQuestionConceptWhat, setShowPlanQuestionConceptWhat] = useState(true);
  const [showPlanQuestionConceptWhy, setShowPlanQuestionConceptWhy] = useState(false);
  const [memoryMapLens, setMemoryMapLens] = useState<MemoryMapLens>('architecture');
  const [selectedMemoryMapClusterId, setSelectedMemoryMapClusterId] = useState(DEFAULT_MEMORY_MAP_CLUSTER_ID);

  const previewTimeoutRef = useRef<number | null>(null);
  const splitPaneTimersRef = useRef<Record<string, number>>({});

  const scenario = useMemo(() => getScenarioById(scenarioId), [scenarioId]);

  useEffect(() => {
    const onResize = () => setViewportMode(getViewportMode(window.innerWidth));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setPresenterMode(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const nextIdeaId = getIdeaSectionIdFromHash(window.location.hash);
      if (nextIdeaId) {
        setActiveIdeaId(nextIdeaId);
      }
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(
    () => () => {
      if (previewTimeoutRef.current) {
        window.clearTimeout(previewTimeoutRef.current);
      }

      Object.values(splitPaneTimersRef.current).forEach((timerId) => {
        window.clearTimeout(timerId);
      });
    },
    []
  );

  useEffect(() => {
    if (session.status !== 'approved_simulation') {
      return;
    }

    const activeIndex = simulationEvents.findIndex((event) => event.state === 'active');
    if (activeIndex === -1) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const timestamp = new Date().toISOString();

      setSimulationEvents((current) => {
        const currentActiveIndex = current.findIndex((event) => event.state === 'active');

        if (currentActiveIndex === -1) {
          return current;
        }

        return current.map((event, index) => {
          if (index < currentActiveIndex) {
            return event;
          }

          if (index === currentActiveIndex) {
            return {
              ...event,
              state: 'complete',
              timestamp
            };
          }

          if (index === currentActiveIndex + 1) {
            return {
              ...event,
              state: 'active',
              timestamp
            };
          }

          return event;
        });
      });
    }, 750);

    return () => window.clearTimeout(timeoutId);
  }, [session.status, simulationEvents]);

  const previewStale = useMemo(() => {
    if (!generatedPreview) {
      return false;
    }

    return previewInvalidated || isPreviewStale(session.planText, generatedPreview.sourcePlanHash);
  }, [generatedPreview, previewInvalidated, session.planText]);

  const simulationComplete =
    session.status === 'approved_simulation' &&
    simulationEvents.length > 0 &&
    simulationEvents.every((event) => event.state === 'complete');

  useEffect(() => {
    if (!simulationComplete || !generatedPreview || artifact) {
      return;
    }

    setArtifact(buildApprovalArtifact(session, generatedPreview, simulationEvents));
  }, [artifact, generatedPreview, session, simulationComplete, simulationEvents]);

  const completedSteps = simulationEvents.filter((event) => event.state === 'complete').length;
  const activeStep = simulationEvents.find((event) => event.state === 'active');
  const simulationProgress = simulationEvents.length === 0 ? 0 : Math.round((completedSteps / simulationEvents.length) * 100);

  const canCompletePlan = session.planText.trim().length >= MIN_PLAN_LENGTH;
  const canGeneratePreview = session.status === 'plan_complete' && previewGenerationState !== 'generating';
  const canApprove = session.status === 'preview_ready' && Boolean(generatedPreview) && !previewStale;

  const previewExplanation = useMemo(() => {
    if (!generatedPreview) {
      return null;
    }

    return buildPreviewExplanation(session.planText, generatedPreview.spec, scenario);
  }, [generatedPreview, scenario, session.planText]);

  const shareState = useMemo<ShareState>(
    () => ({
      scenarioId,
      session,
      generatedPreview,
      previewInvalidated,
      artifact: artifact ?? undefined
    }),
    [artifact, generatedPreview, previewInvalidated, scenarioId, session]
  );

  const shareUrl = useMemo(() => buildShareUrl(shareState), [shareState]);
  const runningSplitPaneCount = splitPanes.filter((pane) => pane.state === 'running').length;
  const completedSplitPaneCount = splitPanes.filter((pane) => pane.state === 'done').length;
  const sidebarWeightClass = `session-weight-${sidebarTitleWeight}`;
  const selectedPlanQuestionPreview = useMemo(
    () => getPlanQuestionPreviewSample(planQuestionPreviewId),
    [planQuestionPreviewId]
  );
  const selectedMemoryMapCluster = useMemo(
    () => getMemoryMapCluster(selectedMemoryMapClusterId),
    [selectedMemoryMapClusterId]
  );
  const sessionSidebarCapture = useMemo(
    () => FEATURE_CAPTURES.find((capture) => capture.sectionId === 'session-sidebar') ?? null,
    []
  );
  const planQuestionCapture = useMemo(
    () => FEATURE_CAPTURES.find((capture) => capture.sectionId === 'plan-question') ?? null,
    []
  );
  const selectedTeamSnapshot = useMemo(() => getTeamSnapshot(selectedTeamId), [selectedTeamId]);
  const pullRequestSuggestions = useMemo(
    () => buildPullRequestSuggestions(selectedTeamSnapshot, skillsFocus),
    [selectedTeamSnapshot, skillsFocus]
  );
  const companyAverageSpread = useMemo(
    () =>
      Math.round(
        TEAM_SKILLS_SNAPSHOTS.reduce((total, team) => total + team.knowledgeSpread, 0) / TEAM_SKILLS_SNAPSHOTS.length
      ),
    []
  );

  const navigateToIdea = (ideaId: IdeaSectionId) => {
    setActiveIdeaId(ideaId);

    const nextSectionId = IDEA_SECTION_DOM_IDS[ideaId];
    const nextUrl = `${window.location.pathname}${window.location.search}#${nextSectionId}`;
    window.history.replaceState(null, '', nextUrl);

    const nextSection = document.getElementById(nextSectionId);
    nextSection?.scrollIntoView?.({
      behavior: 'smooth',
      block: 'start'
    });
  };

  const handleSplitPaneCountChange = (value: string) => {
    const requested = Number.parseInt(value, 10);
    const nextCount = Number.isNaN(requested)
      ? DEFAULT_SPLIT_PANE_COUNT
      : Math.max(2, Math.min(MAX_SPLIT_PANE_COUNT, requested));

    setSplitPaneCount(nextCount);
    setSplitPanes((current) => {
      const resized = resizeSplitPanes(current, nextCount);
      const allowedIds = new Set(resized.map((pane) => pane.id));

      Object.entries(splitPaneTimersRef.current).forEach(([paneId, timerId]) => {
        if (!allowedIds.has(paneId)) {
          window.clearTimeout(timerId);
          delete splitPaneTimersRef.current[paneId];
        }
      });

      return resized;
    });
  };

  const resetSplitPanes = () => {
    Object.values(splitPaneTimersRef.current).forEach((timerId) => {
      window.clearTimeout(timerId);
    });
    splitPaneTimersRef.current = {};
    setSplitPanes(buildSplitPanes(splitPaneCount));
  };

  const updateSplitPanePrompt = (paneId: string, nextPrompt: string) => {
    const activeTimer = splitPaneTimersRef.current[paneId];
    if (activeTimer) {
      window.clearTimeout(activeTimer);
      delete splitPaneTimersRef.current[paneId];
    }

    setSplitPanes((current) =>
      current.map((pane) =>
        pane.id === paneId
          ? {
              ...pane,
              prompt: nextPrompt,
              state: 'idle',
              log: []
            }
          : pane
      )
    );
  };

  const runSplitPane = (paneId: string) => {
    const pane = splitPanes.find((item) => item.id === paneId);
    if (!pane || !pane.prompt.trim()) {
      return;
    }

    const activeTimer = splitPaneTimersRef.current[paneId];
    if (activeTimer) {
      window.clearTimeout(activeTimer);
    }

    const startTimestamp = new Date().toLocaleTimeString();
    setSplitPanes((current) =>
      current.map((item) =>
        item.id === paneId
          ? {
              ...item,
              state: 'running',
              log: [
                `[${startTimestamp}] Prompt captured.`,
                'Dispatching prompt to Codex workspace...',
                `Prompt preview: ${item.prompt.slice(0, 92)}${item.prompt.length > 92 ? '...' : ''}`
              ]
            }
          : item
      )
    );

    splitPaneTimersRef.current[paneId] = window.setTimeout(() => {
      const endTimestamp = new Date().toLocaleTimeString();

      setSplitPanes((current) =>
        current.map((item) =>
          item.id === paneId
            ? {
                ...item,
                state: 'done',
                log: [
                  ...item.log,
                  `[${endTimestamp}] Rendered prompt and output visible in split pane.`
                ]
              }
            : item
        )
      );
      delete splitPaneTimersRef.current[paneId];
    }, 900);
  };

  const resetScenario = (nextScenarioId: string) => {
    const nextScenario = getScenarioById(nextScenarioId);

    if (previewTimeoutRef.current) {
      window.clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }

    setScenarioId(nextScenario.id);
    setSession(createSessionFromScenario(nextScenario));
    setGeneratedPreview(null);
    setPreviewInvalidated(false);
    setSimulationEvents([]);
    setArtifact(null);
    setPreviewGenerationState('idle');
    setPlanError(null);
    setPreviewError(null);
    setShowPlanQuestionInfo(false);
    setShowPlanWhyInfo(false);
    setShareMessage('');
  };

  const handleGoalChange = (value: string) => {
    setSession((current) => ({
      ...current,
      userGoal: value,
      updatedAt: new Date().toISOString()
    }));
  };

  const handlePlanChange = (value: string) => {
    if (previewTimeoutRef.current) {
      window.clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }

    setSession((current) =>
      updateStatus(
        {
          ...current,
          planText: value
        },
        'drafting'
      )
    );

    if (generatedPreview) {
      setPreviewInvalidated(true);
    }

    setSimulationEvents([]);
    setArtifact(null);
    setPreviewGenerationState('idle');
    setPlanError(null);
    setPreviewError(null);
  };

  const markPlanComplete = () => {
    if (!canCompletePlan) {
      setPlanError(`Plan draft must be at least ${MIN_PLAN_LENGTH} characters before completion.`);
      return;
    }

    setSession((current) => updateStatus(current, 'plan_complete'));
    setPlanError(null);
  };

  const generatePreview = () => {
    if (!canGeneratePreview) {
      setPlanError('Mark the plan complete before generating a preview.');
      return;
    }

    setPlanError(null);
    setPreviewError(null);
    setPreviewGenerationState('generating');

    previewTimeoutRef.current = window.setTimeout(() => {
      try {
        const spec = parsePlanToPreviewSpec(session.planText);

        setGeneratedPreview({
          spec,
          generatedAt: new Date().toISOString(),
          sourcePlanHash: hashPlanText(session.planText)
        });

        setPreviewInvalidated(false);
        setSimulationEvents([]);
        setArtifact(null);
        setPreviewGenerationState('ready');
        setSession((current) => updateStatus(current, 'preview_ready'));
      } catch {
        setPreviewGenerationState('error');
        setPreviewError('Unable to generate a preview from this plan. Try revising the plan text.');
      }
    }, 600);
  };

  const revisePlan = () => {
    if (!generatedPreview) {
      return;
    }

    setPreviewInvalidated(true);
    setSimulationEvents([]);
    setArtifact(null);
    setSession((current) => updateStatus(current, 'drafting'));
    setPreviewGenerationState('idle');
  };

  const approveBuild = () => {
    if (!canApprove) {
      return;
    }

    const now = new Date().toISOString();
    const events: BuildSimulationEvent[] = SIMULATION_STEPS.map((step, index) => ({
      stepId: step.stepId,
      label: step.label,
      state: index === 0 ? 'active' : 'pending',
      timestamp: now
    }));

    setSimulationEvents(events);
    setSession((current) => updateStatus(current, 'approved_simulation'));
  };

  const copyDeepLink = async () => {
    if (!shareUrl) {
      setShareMessage('Unable to create share link in this environment.');
      return;
    }

    const encoded = new URL(shareUrl).searchParams.get('state');
    if (encoded) {
      window.history.replaceState(null, '', `?state=${encoded}`);
    }

    if (!navigator.clipboard) {
      setShareMessage('Clipboard not available. Copy the URL field manually.');
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareMessage('Deep link copied.');
    } catch {
      setShareMessage('Clipboard write failed. Copy the URL field manually.');
    }
  };

  const exportArtifact = () => {
    if (!artifact) {
      return;
    }

    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = `${artifact.artifactId}.json`;
    anchor.click();

    URL.revokeObjectURL(url);
  };

  const togglePresenterMode = async () => {
    if (!document.fullscreenEnabled) {
      setPresenterMode((current) => !current);
      return;
    }

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    try {
      await document.documentElement.requestFullscreen();
      setPresenterMode(true);
    } catch {
      setPresenterMode((current) => !current);
    }
  };

  return (
    <div className={`app-shell ${presenterMode ? 'presenter-mode' : ''}`} data-viewport-mode={viewportMode}>
      <header className="app-header">
        <div>
          <h1>Codex UX Concepts</h1>
          <p>Pictures and mock ideas from the README, organized in one place.</p>
        </div>
        <div className="header-actions">
          <button type="button" onClick={togglePresenterMode}>
            {presenterMode ? 'Exit Presenter Mode' : 'Presenter Mode'}
          </button>
        </div>
      </header>

      <main className="idea-site">
        <nav className="idea-card-grid" aria-label="Idea navigation">
          {IDEA_SHOWCASES.map((idea, index) => (
            <button
              key={idea.id}
              type="button"
              className={`idea-card ${activeIdeaId === idea.id ? 'idea-card-active' : ''}`}
              onClick={() => navigateToIdea(idea.id)}
              aria-pressed={activeIdeaId === idea.id}
              aria-label={`Open ${idea.title}`}
            >
              <div className="idea-card-topline">
                <span className="idea-card-index">{String(index + 1).padStart(2, '0')}</span>
                <span className="idea-card-format">{idea.format}</span>
              </div>
              <p className="eyebrow">{idea.eyebrow}</p>
              <p className="idea-card-title">{idea.title}</p>
              <p>{idea.summary}</p>
              <strong className="idea-card-highlight">{idea.highlight}</strong>
            </button>
          ))}
        </nav>

        <section
          id={IDEA_SECTION_DOM_IDS['plan-preview']}
          className={`idea-section idea-preview-studio ${activeIdeaId === 'plan-preview' ? 'idea-section-active' : ''}`}
          aria-labelledby="plan-preview-studio-title"
        >
          <div className="idea-section-intro">
            <div>
              <p className="eyebrow">Picture Example</p>
              <h2 id="plan-preview-studio-title">Plan Preview Studio</h2>
              <p>
                Show a deterministic implementation picture before Codex writes code, then preserve that approval as an
                artifact.
              </p>
            </div>
            <div className="idea-section-note">
              <p className="eyebrow">Core value</p>
              <p>Pre-build preview plus approval artifact flow.</p>
            </div>
          </div>

          <article className="reference-shot-card plan-preview-static-card">
            <img
              src={planPreviewStudioShot}
              alt="Plan Preview Studio review image showing a Codex-style planning conversation, a thought summary, and a preview card labeled This is how it could look."
              className="reference-shot-image plan-preview-static-image"
            />
            <div className="reference-shot-copy plan-preview-static-copy">
              <p className="eyebrow">Static Example</p>
              <h3>Fixed plan-review reference</h3>
              <p>Show the preview in the conversation before code starts.</p>
            </div>
          </article>

          <div hidden aria-hidden="true">
          <div className="pane-grid">
            <section className="pane pane-plan" aria-label="Plan mode mock composer">
              <div className="pane-head">
                <h3>Guided Demo Mode</h3>
                <div className="status-row">
                  <span className={`status-chip status-${session.status}`}>{statusLabel(session.status)}</span>
                  {generatedPreview ? (
                    <span className={`status-chip ${previewStale ? 'status-warning' : 'status-synced'}`}>
                      {previewStale ? 'Preview stale' : 'Preview synced'}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="scenario-controls">
                <label htmlFor="scenario-switch">Scenario</label>
                <select
                  id="scenario-switch"
                  value={scenario.id}
                  onChange={(event) => resetScenario(event.target.value)}
                  aria-label="Scenario switcher"
                >
                  {DEMO_SCENARIOS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={() => resetScenario(scenario.id)}>
                  Reset Demo
                </button>
              </div>

              <div className="scenario-meta">
                <p className="eyebrow">Expected Preview Quality</p>
                <p>{qualityLabelFromTags(scenario)}</p>
                <div className="tag-row">
                  {scenario.tags.map((tag) => (
                    <span key={tag} className="scenario-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <label htmlFor="goal-input">User goal</label>
              <textarea
                id="goal-input"
                value={session.userGoal}
                onChange={(event) => handleGoalChange(event.target.value)}
                rows={3}
              />

              <div className="field-label-row">
                <label htmlFor="plan-input">Plan draft</label>
                <div className="plan-info-actions" aria-label="Plan help actions">
                  <button
                    type="button"
                    className={`inline-info-button ${showPlanQuestionInfo ? 'inline-info-button-active' : ''}`}
                    onClick={() => setShowPlanQuestionInfo((current) => !current)}
                    aria-label="What is this asking?"
                    aria-expanded={showPlanQuestionInfo}
                    aria-controls="plan-question-help"
                  >
                    i
                  </button>
                  <button
                    type="button"
                    className={`inline-info-button ${showPlanWhyInfo ? 'inline-info-button-active' : ''}`}
                    onClick={() => setShowPlanWhyInfo((current) => !current)}
                    aria-label="Why this question?"
                    aria-expanded={showPlanWhyInfo}
                    aria-controls="plan-why-help"
                  >
                    i
                  </button>
                </div>
              </div>

              {showPlanQuestionInfo || showPlanWhyInfo ? (
                <div className="inline-info-stack">
                  {showPlanQuestionInfo ? (
                    <p id="plan-question-help" className="inline-info-text">
                      This asks for concrete plan steps so the preview can map what should be built.
                    </p>
                  ) : null}
                  {showPlanWhyInfo ? (
                    <p id="plan-why-help" className="inline-info-text">
                      We ask this in general to capture intent before coding, so teams can align on scope and decisions
                      early.
                    </p>
                  ) : null}
                </div>
              ) : null}

              <textarea
                id="plan-input"
                value={session.planText}
                onChange={(event) => handlePlanChange(event.target.value)}
                rows={12}
              />

              {session.planText.trim().length < MIN_PLAN_LENGTH ? (
                <p className="hint">Plan draft needs at least {MIN_PLAN_LENGTH} characters before completion.</p>
              ) : null}

              {planError ? (
                <p className="alert" role="alert">
                  {planError}
                </p>
              ) : null}

              {previewError ? (
                <p className="alert" role="alert">
                  {previewError}
                </p>
              ) : null}

              {previewStale ? (
                <p className="alert" role="alert">
                  Plan changed after preview generation. Regenerate before approving build.
                </p>
              ) : null}

              {previewGenerationState === 'generating' ? (
                <p className="progress-text" role="status">
                  Generating deterministic preview...
                </p>
              ) : null}

              <div className="action-row">
                <button type="button" onClick={markPlanComplete} disabled={!canCompletePlan}>
                  Mark Plan Complete
                </button>
                <button type="button" onClick={generatePreview} disabled={!canGeneratePreview}>
                  Generate Preview
                </button>
                <button type="button" onClick={revisePlan} disabled={!generatedPreview}>
                  Revise Plan
                </button>
                <button type="button" onClick={approveBuild} disabled={!canApprove}>
                  Approve Build
                </button>
              </div>

              <div className="share-controls">
                <label htmlFor="share-url">Deep link</label>
                <input id="share-url" value={shareUrl} readOnly />
                <div className="share-buttons">
                  <button type="button" onClick={copyDeepLink}>
                    Copy Deep Link
                  </button>
                  <button type="button" onClick={exportArtifact} disabled={!artifact}>
                    Export Artifact JSON
                  </button>
                </div>
                {shareMessage ? <p className="hint">{shareMessage}</p> : null}
              </div>
            </section>

            <section className="pane pane-preview" aria-label="Implementation picture and simulation">
              <div className="pane-head">
                <h3>Generated Picture</h3>
                {generatedPreview ? (
                  <p>Created {new Date(generatedPreview.generatedAt).toLocaleTimeString()}</p>
                ) : (
                  <p>No preview generated yet.</p>
                )}
              </div>

              {generatedPreview ? (
                <PreviewCanvas spec={generatedPreview.spec} />
              ) : (
                <div className="empty-preview">
                  <p>Complete the plan, then click Generate Preview to visualize the implementation outcome.</p>
                </div>
              )}

              {previewExplanation ? (
                <section className="explanation-panel" aria-label="Preview explanation">
                  <h3>Preview Explanation</h3>
                  <p>{previewExplanation.rationale}</p>
                  <div className="explanation-grid">
                    <div>
                      <p className="eyebrow">Extracted assumptions</p>
                      <ul>
                        {previewExplanation.assumptions.map((assumption) => (
                          <li key={assumption}>{assumption}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="eyebrow">Mapped components</p>
                      <ul>
                        {previewExplanation.mappedComponents.map((component, index) => (
                          <li key={`${component}-${index}`}>{component}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </section>
              ) : null}

              <div className="simulation-panel">
                <h3>Build Simulation</h3>
                {simulationEvents.length === 0 ? (
                  <p className="muted">Approval has not been triggered yet.</p>
                ) : (
                  <>
                    <div className="sim-progress">
                      <div className="sim-progress__bar" style={{ width: `${simulationProgress}%` }} />
                    </div>
                    <p className="muted">
                      {simulationComplete
                        ? 'Simulation complete.'
                        : `Running ${activeStep?.label ?? 'simulation'} (${completedSteps}/${simulationEvents.length})`}
                    </p>
                    <ol>
                      {simulationEvents.map((event) => (
                        <li key={event.stepId} className={`simulation-${event.state}`}>
                          <span>{event.label}</span>
                          <small>{event.state}</small>
                        </li>
                      ))}
                    </ol>
                  </>
                )}
                {simulationComplete ? (
                  <p className="completion" role="status">
                    Ready to execute for real.
                  </p>
                ) : null}
              </div>

              {artifact ? (
                <section className="artifact-panel" aria-label="Approval artifact">
                  <h3>Approval Artifact</h3>
                  <p className="muted">{artifact.summary}</p>
                  <dl>
                    <div>
                      <dt>Artifact ID</dt>
                      <dd>{artifact.artifactId}</dd>
                    </div>
                    <div>
                      <dt>Plan hash</dt>
                      <dd>{artifact.sourcePlanHash}</dd>
                    </div>
                    <div>
                      <dt>Approved at</dt>
                      <dd>{new Date(artifact.approvedAt).toLocaleString()}</dd>
                    </div>
                  </dl>
                  <details>
                    <summary>Preview spec snapshot</summary>
                    <pre>{JSON.stringify(artifact.generatedPreview.spec, null, 2)}</pre>
                  </details>
                </section>
              ) : null}
            </section>
          </div>
          </div>
        </section>

        <section
          id={IDEA_SECTION_DOM_IDS['split-screens']}
          className={`split-screen-lab idea-section ${activeIdeaId === 'split-screens' ? 'idea-section-active' : ''}`}
          aria-label="Codex split screen lab"
        >
        <div className="split-lab-head">
          <div>
            <p className="eyebrow">Picture References</p>
            <h2>Multi-Run Split Screens</h2>
            <p>Large visual references for how multiple visible Codex prompts could work in one place.</p>
          </div>
        </div>

        <section className="split-visual-studies" aria-labelledby="split-visual-studies-title">
          <div className="split-visual-studies-head">
            <div>
              <h3 id="split-visual-studies-title">References</h3>
              <p>Static references only.</p>
            </div>
          </div>

          <div className="split-visual-study-grid">
            {SPLIT_SCREEN_VISUAL_STUDIES.map((study) => (
              <article key={study.id} className="reference-shot-card split-visual-study-card">
                <img src={study.imageSrc} alt={study.imageAlt} className="reference-shot-image split-visual-study-image" />
                <div className="reference-shot-copy split-visual-study-copy">
                  <p className="eyebrow">{study.eyebrow}</p>
                  <h3>{study.title}</h3>
                  <p>{study.summary}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div hidden aria-hidden="true">
          <div className="split-lab-controls">
            <label htmlFor="split-pane-count">Split panes</label>
            <select
              id="split-pane-count"
              aria-label="Split panes"
              value={splitPaneCount}
              onChange={(event) => handleSplitPaneCountChange(event.target.value)}
            >
              <option value={2}>2 panes</option>
              <option value={3}>3 panes</option>
              <option value={4}>4 panes</option>
            </select>
            <button type="button" onClick={resetSplitPanes}>
              Reset Panes
            </button>
          </div>

          <p className="hint">
            {runningSplitPaneCount} running, {completedSplitPaneCount} completed, {splitPanes.length} visible.
          </p>

          <div className={`split-pane-grid split-pane-grid-${splitPaneCount}`}>
            {splitPanes.map((pane, index) => (
              <article key={pane.id} className="split-pane-card" aria-label={`Split pane ${index + 1}`}>
                <header className="split-pane-head">
                  <h3>{pane.title}</h3>
                  <span className={`status-chip split-status-${pane.state}`}>{splitPaneStateLabel(pane.state)}</span>
                </header>

                <label htmlFor={`split-prompt-${pane.id}`}>Pane {index + 1} prompt</label>
                <textarea
                  id={`split-prompt-${pane.id}`}
                  value={pane.prompt}
                  onChange={(event) => updateSplitPanePrompt(pane.id, event.target.value)}
                  rows={6}
                />

                <div className="split-pane-actions">
                  <button
                    type="button"
                    onClick={() => runSplitPane(pane.id)}
                    disabled={!pane.prompt.trim() || pane.state === 'running'}
                  >
                    {pane.state === 'running' ? 'Running...' : 'Run Mock Task'}
                  </button>
                </div>

                <div className="split-log">
                  <p className="eyebrow">Visible output stream</p>
                  {pane.log.length === 0 ? (
                    <p className="muted">No output yet.</p>
                  ) : (
                    <ul>
                      {pane.log.map((entry, logIndex) => (
                        <li key={`${pane.id}-log-${logIndex}`}>{entry}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {STATIC_PICTURE_IDEAS.map((idea) => (
        <section
          key={idea.id}
          id={IDEA_SECTION_DOM_IDS[idea.id]}
          className={`picture-idea-section idea-section ${activeIdeaId === idea.id ? 'idea-section-active' : ''}`}
          aria-labelledby={`${idea.id}-title`}
        >
          <div className="idea-section-intro">
            <div>
              <p className="eyebrow">{idea.eyebrow}</p>
              <h2 id={`${idea.id}-title`}>{idea.title}</h2>
              <p>{idea.summary}</p>
            </div>
          </div>

          <article className="reference-shot-card picture-idea-card">
            <img
              src={idea.imageSrc}
              alt={idea.imageAlt}
              className={`reference-shot-image picture-idea-image ${
                idea.id === 'trusted-repo' ? 'picture-idea-image-trusted-repo' : ''
              }`}
            />
            <div className="reference-shot-copy picture-idea-copy">
              <p className="eyebrow">Static Picture</p>
              <h3>{idea.cardTitle}</h3>
              <p>{idea.cardBody}</p>
            </div>
          </article>
        </section>
      ))}

      <section
        id={IDEA_SECTION_DOM_IDS['session-sidebar']}
        className={`thread-sidebar-lab idea-section ${activeIdeaId === 'session-sidebar' ? 'idea-section-active' : ''}`}
        aria-label="Codex thread sidebar concept"
      >
        <div className="sidebar-lab-head">
          <div>
            <p className="eyebrow">Another Codex App Concept</p>
            <h2>Session Sidebar With Rich Context</h2>
            <p>
              Add short per-session descriptions, color modes, and font-weight tuning so the thread list is more
              scannable than title-only rows.
            </p>
          </div>
          <div className="sidebar-lab-controls">
            <label htmlFor="sidebar-theme-mode">Sidebar color mode</label>
            <select
              id="sidebar-theme-mode"
              aria-label="Sidebar color mode"
              value={sidebarThemeMode}
              onChange={(event) => setSidebarThemeMode(event.target.value as SidebarThemeMode)}
            >
              <option value="terminal">Terminal dark</option>
              <option value="slate">Slate dusk</option>
              <option value="graphite">Graphite glow</option>
            </select>

            <label htmlFor="sidebar-font-weight">Thread font weight</label>
            <select
              id="sidebar-font-weight"
              aria-label="Thread font weight"
              value={sidebarTitleWeight}
              onChange={(event) => setSidebarTitleWeight(event.target.value as SidebarTitleWeight)}
            >
              <option value="regular">Regular</option>
              <option value="medium">Medium</option>
              <option value="semibold">Semibold</option>
            </select>

            <label className="sidebar-check" htmlFor="toggle-thread-descriptions">
              <input
                id="toggle-thread-descriptions"
                type="checkbox"
                checked={showThreadDescriptions}
                onChange={(event) => setShowThreadDescriptions(event.target.checked)}
              />
              Show thread descriptions
            </label>
          </div>
        </div>

        {sessionSidebarCapture ? (
          <article className="reference-shot-card">
            <img src={sessionSidebarCapture.imageSrc} alt={sessionSidebarCapture.imageAlt} className="reference-shot-image" />
            <div className="reference-shot-copy">
              <p className="eyebrow">Source Picture</p>
              <h3>{sessionSidebarCapture.title}</h3>
              <p>{sessionSidebarCapture.summary}</p>
            </div>
          </article>
        ) : null}

        <div className={`sidebar-mock sidebar-theme-${sidebarThemeMode} ${sidebarWeightClass}`}>
          <div className="sidebar-static-actions">
            <span>New thread</span>
            <span>Automations</span>
            <span>Skills</span>
          </div>

          <p className="sidebar-section-title">Threads</p>

          <div className="sidebar-workspaces">
            {SIDEBAR_WORKSPACES.map((workspace) => (
              <section key={workspace.id} className="workspace-group">
                <h3>{workspace.name}</h3>
                <div className="workspace-threads">
                  {workspace.threads.map((thread) => (
                    <article
                      key={thread.id}
                      className={`thread-item ${selectedThreadId === thread.id ? 'thread-item-selected' : ''}`}
                      onClick={() => setSelectedThreadId(thread.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedThreadId(thread.id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`Open ${thread.title}`}
                    >
                      <div className="thread-title-row">
                        <p className="thread-title">{thread.title}</p>
                        <span className="thread-updated">{thread.updated}</span>
                      </div>
                      {showThreadDescriptions ? <p className="thread-description">{thread.description}</p> : null}
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>

      <section
        id={IDEA_SECTION_DOM_IDS['pull-request-radar']}
        className={`pull-request-lab idea-section ${activeIdeaId === 'pull-request-radar' ? 'idea-section-active' : ''}`}
        aria-label="Pull request company skills concept"
      >
        <div className="pull-request-head">
          <div>
            <p className="eyebrow">Simple Direction</p>
            <h2>Pull Request Company Skills Radar</h2>
            <p>Keep this focused on where the skill should change, not on a dense dashboard.</p>
          </div>
        </div>

        <article className="simple-copy-card">
          <p className="eyebrow">Where To Change The Actual Skill</p>
          <p>If review lag stays high, improve the shared review skill and make it easier to adopt across the team.</p>
          <p>If knowledge spread is low, change onboarding and documentation habits instead of only measuring output.</p>
          <p>If reopen rate rises, strengthen the testing and handoff skill before adding more process layers.</p>
        </article>

        <div hidden aria-hidden="true">
          <div className="pull-request-controls">
            <label htmlFor="team-select">Team</label>
            <select
              id="team-select"
              aria-label="Team"
              value={selectedTeamId}
              onChange={(event) => setSelectedTeamId(event.target.value)}
            >
              {TEAM_SKILLS_SNAPSHOTS.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>

            <label htmlFor="skills-focus">Optimization goal</label>
            <select
              id="skills-focus"
              aria-label="Optimization goal"
              value={skillsFocus}
              onChange={(event) => setSkillsFocus(event.target.value as SkillsFocus)}
            >
              <option value="delivery">Delivery speed</option>
              <option value="quality">Quality</option>
              <option value="balance">Balanced</option>
            </select>
          </div>

          <p className="hint">
            Company baseline knowledge spread is {companyAverageSpread}%. Current team health:{' '}
            <strong>{teamHealthLabel(selectedTeamSnapshot)}</strong>.
          </p>

          <div className="pull-request-metric-grid">
            <article className="pull-request-metric-card">
              <p className="eyebrow">Open PRs</p>
              <strong>{selectedTeamSnapshot.openPullRequests}</strong>
            </article>
            <article className="pull-request-metric-card">
              <p className="eyebrow">Merged This Week</p>
              <strong>{selectedTeamSnapshot.mergedThisWeek}</strong>
            </article>
            <article className="pull-request-metric-card">
              <p className="eyebrow">Review Lag (Avg)</p>
              <strong>{selectedTeamSnapshot.avgReviewLagHours}h</strong>
            </article>
            <article className="pull-request-metric-card">
              <p className="eyebrow">Knowledge Spread</p>
              <strong>{selectedTeamSnapshot.knowledgeSpread}%</strong>
            </article>
            <article className="pull-request-metric-card">
              <p className="eyebrow">Shared Skill Adoption</p>
              <strong>{selectedTeamSnapshot.sharedSkillAdoption}%</strong>
            </article>
            <article className="pull-request-metric-card">
              <p className="eyebrow">Defect Reopen Rate</p>
              <strong>{selectedTeamSnapshot.defectReopenRate}%</strong>
            </article>
          </div>

          <div className="pull-request-grid">
            <article className="pull-request-table-card">
              <h3>Team Snapshot</h3>
              <table>
                <thead>
                  <tr>
                    <th>Team</th>
                    <th>Open PRs</th>
                    <th>Review Lag</th>
                    <th>Health</th>
                  </tr>
                </thead>
                <tbody>
                  {TEAM_SKILLS_SNAPSHOTS.map((team) => (
                    <tr key={team.id} className={team.id === selectedTeamId ? 'team-row-selected' : ''}>
                      <td>{team.name}</td>
                      <td>{team.openPullRequests}</td>
                      <td>{team.avgReviewLagHours}h</td>
                      <td>{teamHealthLabel(team)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>

            <article className="pull-request-suggestion-card">
              <h3>Suggested Changes</h3>
              <ol>
                {pullRequestSuggestions.map((suggestion) => (
                  <li key={suggestion.id}>
                    <span className={`suggestion-priority suggestion-${suggestion.priority}`}>{suggestion.priority}</span>
                    <p>{suggestion.text}</p>
                  </li>
                ))}
              </ol>
            </article>
          </div>
        </div>
        </section>

        <section
          id={IDEA_SECTION_DOM_IDS['plan-question']}
          className={`plan-question-lab idea-section ${activeIdeaId === 'plan-question' ? 'idea-section-active' : ''}`}
          aria-labelledby="plan-question-lab-title"
        >
          <div className="plan-question-head">
            <div>
              <p className="eyebrow">Question Framing Concept</p>
              <h2 id="plan-question-lab-title">Plan Question UX</h2>
              <p>Use the picture, then explain in one sentence that the second info button separates intent from why.</p>
            </div>
          </div>

          {planQuestionCapture ? (
            <article className="reference-shot-card">
              <img src={planQuestionCapture.imageSrc} alt={planQuestionCapture.imageAlt} className="reference-shot-image" />
              <div className="reference-shot-copy">
                <p className="eyebrow">Picture</p>
                <h3>{planQuestionCapture.title}</h3>
                <p>The second info button explains why the question exists, so the prompt feels clearer before the user answers.</p>
              </div>
            </article>
          ) : null}

          <div hidden aria-hidden="true">
            <div className="plan-question-controls">
              <label htmlFor="plan-question-preview-select">Question style</label>
              <select
                id="plan-question-preview-select"
                aria-label="Question style"
                value={planQuestionPreviewId}
                onChange={(event) => setPlanQuestionPreviewId(event.target.value)}
              >
                {PLAN_QUESTION_PREVIEW_SAMPLES.map((sample) => (
                  <option key={sample.id} value={sample.id}>
                    {sample.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="plan-question-grid">
              <article className="plan-question-card">
                <p className="eyebrow">Prompt shown to the user</p>
                <div className="plan-question-surface">
                  <div className="plan-question-surface-head">
                    <strong>{selectedPlanQuestionPreview.question}</strong>
                    <div className="plan-info-actions" aria-label="Plan question concept help actions">
                      <button
                        type="button"
                        className={`inline-info-button ${showPlanQuestionConceptWhat ? 'inline-info-button-active' : ''}`}
                        onClick={() => setShowPlanQuestionConceptWhat((current) => !current)}
                        aria-label="Explain what this mock asks"
                        aria-expanded={showPlanQuestionConceptWhat}
                        aria-controls="plan-question-concept-what"
                      >
                        i
                      </button>
                      <button
                        type="button"
                        className={`inline-info-button ${showPlanQuestionConceptWhy ? 'inline-info-button-active' : ''}`}
                        onClick={() => setShowPlanQuestionConceptWhy((current) => !current)}
                        aria-label="Explain why this mock asks it"
                        aria-expanded={showPlanQuestionConceptWhy}
                        aria-controls="plan-question-concept-why"
                      >
                        i
                      </button>
                    </div>
                  </div>

                  {showPlanQuestionConceptWhat || showPlanQuestionConceptWhy ? (
                    <div className="inline-info-stack">
                      {showPlanQuestionConceptWhat ? (
                        <p id="plan-question-concept-what" className="inline-info-text">
                          {selectedPlanQuestionPreview.whatHelp}
                        </p>
                      ) : null}
                      {showPlanQuestionConceptWhy ? (
                        <p id="plan-question-concept-why" className="inline-info-text">
                          {selectedPlanQuestionPreview.whyHelp}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </article>

              <article className="plan-question-card">
                <p className="eyebrow">Example answer preview</p>
                <div className="plan-question-answer">
                  <p>{selectedPlanQuestionPreview.exampleAnswer}</p>
                </div>
                <div className="plan-question-callout">
                  <p className="eyebrow">Why the second info button matters</p>
                  <p>
                    One button explains the prompt itself. The other explains the meta-reason for asking it. That keeps
                    the UX informative without collapsing intent and rationale into one blob.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section
          id={IDEA_SECTION_DOM_IDS['memory-map']}
          className={`memory-map-lab idea-section ${activeIdeaId === 'memory-map' ? 'idea-section-active' : ''}`}
          aria-labelledby="memory-map-title"
        >
          <div className="memory-map-head">
            <div>
              <p className="eyebrow">Internal Repo Moat</p>
              <h2 id="memory-map-title">Codebase Memory Map</h2>
              <p>
                Keep this simple: store symbols, ownership, and dependency notes so Codex starts from stable repo context.
              </p>
            </div>
          </div>

          <div className="simple-memory-map-grid">
            <article className="simple-memory-card">
              <p className="eyebrow">Symbols</p>
              <p>Index the important entry points and major symbols once so Codex does not keep re-reading the same files.</p>
            </article>
            <article className="simple-memory-card">
              <p className="eyebrow">Dependencies</p>
              <p>Keep a short coupling map so risky edits are obvious before opening the whole repo tree.</p>
            </article>
            <article className="simple-memory-card">
              <p className="eyebrow">Ownership</p>
              <p>Store reviewer and architecture context here, and keep <code>AGENTS.md</code> short and operational.</p>
            </article>
          </div>

          <div hidden aria-hidden="true">
            <div className="memory-map-controls">
              <label htmlFor="memory-map-lens">Lens</label>
              <select
                id="memory-map-lens"
                aria-label="Memory map lens"
                value={memoryMapLens}
                onChange={(event) => setMemoryMapLens(event.target.value as MemoryMapLens)}
              >
                <option value="architecture">Architecture</option>
                <option value="ownership">Ownership</option>
                <option value="dependencies">Dependencies</option>
              </select>
            </div>

            <p className="hint">{MEMORY_MAP_LENS_COPY[memoryMapLens]}</p>

            <div className="memory-map-grid">
              <article className="memory-map-cluster-panel">
                <p className="eyebrow">Repo clusters</p>
                <div className="memory-map-cluster-list">
                  {MEMORY_MAP_CLUSTERS.map((cluster) => (
                    <button
                      key={cluster.id}
                      type="button"
                      className={`memory-map-cluster ${selectedMemoryMapClusterId === cluster.id ? 'memory-map-cluster-active' : ''}`}
                      onClick={() => setSelectedMemoryMapClusterId(cluster.id)}
                      aria-pressed={selectedMemoryMapClusterId === cluster.id}
                    >
                      <span>{cluster.label}</span>
                      <small>{cluster.owner}</small>
                      <strong>{cluster.symbolCount} symbols</strong>
                    </button>
                  ))}
                </div>
              </article>

              <article className="memory-map-detail-panel">
                <p className="eyebrow">Selected cluster</p>
                <h3>{selectedMemoryMapCluster.label}</h3>
                <p>{memoryMapLensNarrative(selectedMemoryMapCluster, memoryMapLens)}</p>

                <dl className="memory-map-stats">
                  <div>
                    <dt>Owner</dt>
                    <dd>{selectedMemoryMapCluster.owner}</dd>
                  </div>
                  <div>
                    <dt>Mapped symbols</dt>
                    <dd>{selectedMemoryMapCluster.symbolCount}</dd>
                  </div>
                  <div>
                    <dt>Dependency risk</dt>
                    <dd>{memoryMapRiskLabel(selectedMemoryMapCluster.dependencyRisk)}</dd>
                  </div>
                </dl>

                <div className="chip-strip">
                  {selectedMemoryMapCluster.symbols.map((symbol) => (
                    <span key={symbol} className="chip">
                      {symbol}
                    </span>
                  ))}
                </div>
              </article>
            </div>

            <div className="memory-map-footer">
              <article className="memory-map-footnote">
                <p className="eyebrow">Reasoning flow</p>
                <ol>
                  <li>Consult the memory map first.</li>
                  <li>Open only the files needed to confirm the plan.</li>
                  <li>Edit with architecture and ownership context already loaded.</li>
                </ol>
              </article>

              <article className="memory-map-footnote">
                <p className="eyebrow">AGENTS.md stays short</p>
                <p>
                  Keep <code>AGENTS.md</code> focused on rules and workflows. Store rich codebase understanding in the
                  memory map so instructions do not become a giant knowledge dump.
                </p>
              </article>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
