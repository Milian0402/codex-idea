import { useEffect, useMemo, useState } from 'react';
import { SEEDED_GOAL, SEEDED_PLAN } from './demoSeed';
import { getViewportMode } from './lib/layout';
import { hashPlanText } from './lib/hash';
import { isPreviewStale, parsePlanToPreviewSpec } from './lib/planParser';
import type {
  BuildSimulationEvent,
  GeneratedPreview,
  PlanSession,
  PlanStatus,
  PreviewSpec
} from './types';

const SIMULATION_STEPS = [
  { stepId: 'lock-plan', label: 'Locking approved plan snapshot' },
  { stepId: 'map-ui', label: 'Mapping UI components to build intent' },
  { stepId: 'validate', label: 'Running deterministic safety checks' },
  { stepId: 'stage', label: 'Staging implementation packets' },
  { stepId: 'ready', label: 'Ready to execute for real' }
] as const;

const createInitialSession = (): PlanSession => ({
  id: 'seed-plan-session',
  userGoal: SEEDED_GOAL,
  planText: SEEDED_PLAN,
  status: 'drafting',
  updatedAt: new Date().toISOString()
});

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
  const [session, setSession] = useState<PlanSession>(() => createInitialSession());
  const [generatedPreview, setGeneratedPreview] = useState<GeneratedPreview | null>(null);
  const [previewInvalidated, setPreviewInvalidated] = useState(false);
  const [simulationEvents, setSimulationEvents] = useState<BuildSimulationEvent[]>([]);
  const [viewportMode, setViewportMode] = useState(() => getViewportMode(window.innerWidth));

  useEffect(() => {
    const onResize = () => setViewportMode(getViewportMode(window.innerWidth));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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

  const canCompletePlan = session.planText.trim().length >= 40;
  const canGeneratePreview = session.status === 'plan_complete';
  const canApprove = session.status === 'preview_ready' && Boolean(generatedPreview) && !previewStale;

  const updateStatus = (status: PlanStatus) => {
    setSession((current) => ({
      ...current,
      status,
      updatedAt: new Date().toISOString()
    }));
  };

  const handleGoalChange = (value: string) => {
    setSession((current) => ({
      ...current,
      userGoal: value,
      updatedAt: new Date().toISOString()
    }));
  };

  const handlePlanChange = (value: string) => {
    setSession((current) => ({
      ...current,
      planText: value,
      status: 'drafting',
      updatedAt: new Date().toISOString()
    }));

    if (generatedPreview) {
      setPreviewInvalidated(true);
    }

    setSimulationEvents([]);
  };

  const markPlanComplete = () => {
    if (!canCompletePlan) {
      return;
    }

    updateStatus('plan_complete');
  };

  const generatePreview = () => {
    if (!canGeneratePreview) {
      return;
    }

    const spec = parsePlanToPreviewSpec(session.planText);
    setGeneratedPreview({
      spec,
      generatedAt: new Date().toISOString(),
      sourcePlanHash: hashPlanText(session.planText)
    });

    setPreviewInvalidated(false);
    setSimulationEvents([]);
    updateStatus('preview_ready');
  };

  const revisePlan = () => {
    if (!generatedPreview) {
      return;
    }

    setPreviewInvalidated(true);
    setSimulationEvents([]);
    updateStatus('drafting');
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
    updateStatus('approved_simulation');
  };

  return (
    <div className="app-shell" data-viewport-mode={viewportMode}>
      <header className="app-header">
        <div>
          <p className="eyebrow">Codex Idea Prototype</p>
          <h1>Plan Mode Preview Demo</h1>
          <p>
            Generate a deterministic visual of what Codex would implement, review it, then approve a mock build
            timeline.
          </p>
        </div>
      </header>

      <main className="pane-grid">
        <section className="pane pane-plan" aria-label="Plan mode mock composer">
          <div className="pane-head">
            <h2>Plan Composer</h2>
            <div className="status-row">
              <span className={`status-chip status-${session.status}`}>{statusLabel(session.status)}</span>
              {generatedPreview ? (
                <span className={`status-chip ${previewStale ? 'status-warning' : 'status-synced'}`}>
                  {previewStale ? 'Preview stale' : 'Preview synced'}
                </span>
              ) : null}
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
            rows={14}
          />

          {previewStale ? (
            <p className="alert" role="alert">
              Plan changed after preview generation. Regenerate before approving build.
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

          <div className="simulation-panel">
            <h3>Build Simulation</h3>
            {simulationEvents.length === 0 ? (
              <p className="muted">Approval has not been triggered yet.</p>
            ) : (
              <ol>
                {simulationEvents.map((event) => (
                  <li key={event.stepId} className={`simulation-${event.state}`}>
                    <span>{event.label}</span>
                    <small>{event.state}</small>
                  </li>
                ))}
              </ol>
            )}
            {simulationComplete ? (
              <p className="completion" role="status">
                Ready to execute for real.
              </p>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
