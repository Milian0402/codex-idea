import { useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_SCENARIO_ID, DEMO_SCENARIOS, getScenarioById } from './demoScenarios';
import { buildApprovalArtifact } from './lib/artifact';
import { hashPlanText } from './lib/hash';
import { getViewportMode } from './lib/layout';
import { isPreviewStale, parsePlanToPreviewSpec } from './lib/planParser';
import { deserializeShareState, serializeShareState } from './lib/shareState';
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

type PreviewGenerationState = 'idle' | 'generating' | 'ready' | 'error';

interface PreviewExplanation {
  assumptions: string[];
  mappedComponents: string[];
  rationale: string;
}

interface BootstrapState {
  scenarioId: string;
  session: PlanSession;
  generatedPreview: GeneratedPreview | null;
  previewInvalidated: boolean;
  artifact: ApprovalArtifact | null;
  simulationEvents: BuildSimulationEvent[];
}

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
  const [shareMessage, setShareMessage] = useState<string>('');
  const [presenterMode, setPresenterMode] = useState(false);

  const previewTimeoutRef = useRef<number | null>(null);

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

  useEffect(
    () => () => {
      if (previewTimeoutRef.current) {
        window.clearTimeout(previewTimeoutRef.current);
      }
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
          <p className="eyebrow">Codex Idea MVP Demo</p>
          <h1>Plan Mode Preview Studio</h1>
          <p>
            Guided scenarios demonstrate how Plan Mode could expose a pre-generated implementation picture before any
            coding starts.
          </p>
        </div>
        <div className="header-actions">
          <button type="button" onClick={togglePresenterMode}>
            {presenterMode ? 'Exit Presenter Mode' : 'Presenter Mode'}
          </button>
        </div>
      </header>

      <main className="pane-grid">
        <section className="pane pane-plan" aria-label="Plan mode mock composer">
          <div className="pane-head">
            <h2>Guided Demo Mode</h2>
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

          <label htmlFor="plan-input">Plan draft</label>
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
            <h2>Generated Picture</h2>
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
      </main>
    </div>
  );
}
