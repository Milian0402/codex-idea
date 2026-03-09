import { useEffect, useState } from 'react';
import { getViewportMode } from './lib/layout';
import sidebarReferenceShot from './assets/sidebar-reference.png';
import planQuestionReferenceShot from './assets/plan-question-reference.png';
import phoneEmulatorQuickOpenShot from './assets/phone-emulator-quick-open.png';
import planPreviewStudioShot from './assets/plan-preview-studio.png';
import sessionTabsShot from './assets/session-tabs.png';
import splitScreenTerminalStudyShot from './assets/split-screen-terminal-study.svg';
import trustedRepoAutoOpenShot from './assets/trusted-repo-auto-open.png';

type SidebarThemeMode = 'terminal' | 'slate' | 'graphite';
type SidebarTitleWeight = 'regular' | 'medium' | 'semibold';
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

interface IdeaShowcase {
  id: IdeaSectionId;
  title: string;
  eyebrow: string;
  summary: string;
  format: 'picture' | 'mock' | 'program';
  highlight: string;
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

interface ScreenshotReference {
  title: string;
  summary: string;
  imageSrc: string;
  imageAlt: string;
}

interface StaticPictureIdea {
  id: Extract<IdeaSectionId, 'session-tabs' | 'trusted-repo' | 'phone-emulator'>;
  title: string;
  eyebrow: string;
  summary: string;
  cardTitle: string;
  cardBody: string;
  imageSrc: string;
  imageAlt: string;
}

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
    format: 'picture',
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
    format: 'picture',
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

const SPLIT_SCREEN_REFERENCE: ScreenshotReference = {
  title: 'Codex split-screen reference',
  summary: 'One clear reference based on the shared multi-terminal screenshot, with visible prompts and outputs side by side.',
  imageSrc: splitScreenTerminalStudyShot,
  imageAlt: 'Terminal layout study inspired by a multi-terminal Codex screenshot, showing three dark panes with visible prompts and responses.'
};

const SESSION_SIDEBAR_REFERENCE: ScreenshotReference = {
  title: 'Sidebar reference',
  summary: 'Reference image for richer session subtitles and better thread scanning inside the sidebar.',
  imageSrc: sidebarReferenceShot,
  imageAlt: 'Screenshot reference showing a dark session sidebar next to a conversation view.'
};

const PLAN_QUESTION_REFERENCE: ScreenshotReference = {
  title: 'Plan question reference',
  summary: 'The second info button explains why the question exists, so the prompt feels clearer before the user answers.',
  imageSrc: planQuestionReferenceShot,
  imageAlt: 'Screenshot reference showing a question card with an explanatory info tooltip.'
};

const STATIC_PICTURE_IDEAS: StaticPictureIdea[] = [
  {
    id: 'session-tabs',
    title: 'Chrome-Like Session Tabs',
    eyebrow: 'README Picture Concept',
    summary: 'Make multiple coding contexts easier to manage and switch between without losing state.',
    cardTitle: 'Dockable side-by-side session view',
    cardBody:
      'Keep the active Codex session beside the page or app you are working on, then move that split around as a small quality-of-life improvement instead of reopening context.',
    imageSrc: sessionTabsShot,
    imageAlt: 'Static concept image showing a dark chat window docked beside a live webpage, like a movable browser-level Codex session.'
  },
  {
    id: 'trusted-repo',
    title: 'Trusted Repo Auto-Open',
    eyebrow: 'README Picture Concept',
    summary: 'Skip repetitive repo selection when a trusted repository is already known.',
    cardTitle: 'One startup toggle',
    cardBody: 'Treat this as one simple preference: switch on auto scanning when opening a trusted repo.',
    imageSrc: trustedRepoAutoOpenShot,
    imageAlt: 'Static concept image showing a phone-style startup toggle labeled Switch on auto scanning when opening.'
  },
  {
    id: 'phone-emulator',
    title: 'Phone Emulator Should Be Easier',
    eyebrow: 'README Picture Concept',
    summary: 'Make the existing phone emulator faster to reach for quick mobile checks.',
    cardTitle: 'Expose mobile preview as a first-class shortcut',
    cardBody:
      'The phone emulator is already useful, but it should be a near-immediate action from the main UI instead of feeling buried.',
    imageSrc: phoneEmulatorQuickOpenShot,
    imageAlt: 'Static concept image showing a main Codex workspace with a quick-open control that reveals a phone emulator preview.'
  }
];

const MEMORY_MAP_CARDS = [
  {
    title: 'Symbols',
    body: 'Index the important entry points and major symbols once so Codex does not keep re-reading the same files.'
  },
  {
    title: 'Dependencies',
    body: 'Keep a short coupling map so risky edits are obvious before opening the whole repo tree.'
  },
  {
    title: 'Ownership',
    body: 'Store reviewer and architecture context here, and keep AGENTS.md short and operational.'
  }
] as const;

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

const getInitialViewportMode = () => (typeof window === 'undefined' ? 'desktop' : getViewportMode(window.innerWidth));

export default function App() {
  const [viewportMode, setViewportMode] = useState(getInitialViewportMode);
  const [presenterMode, setPresenterMode] = useState(false);
  const [sidebarThemeMode, setSidebarThemeMode] = useState<SidebarThemeMode>('terminal');
  const [sidebarTitleWeight, setSidebarTitleWeight] = useState<SidebarTitleWeight>('medium');
  const [showThreadDescriptions, setShowThreadDescriptions] = useState(true);
  const [selectedThreadId, setSelectedThreadId] = useState('thread-codex-idea');
  const [activeIdeaId, setActiveIdeaId] = useState<IdeaSectionId>(() => createInitialIdeaSelection());

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
          <p>Pictures and mock ideas from the current project scope, organized in one place.</p>
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
        </section>

        <section
          id={IDEA_SECTION_DOM_IDS['split-screens']}
          className={`split-screen-lab idea-section ${activeIdeaId === 'split-screens' ? 'idea-section-active' : ''}`}
          aria-labelledby="split-screen-title"
        >
          <div className="split-lab-head">
            <div>
              <p className="eyebrow">Picture Reference</p>
              <h2 id="split-screen-title">Multi-Run Split Screens</h2>
              <p>Large visual reference for how multiple visible Codex prompts could work in one place.</p>
            </div>
          </div>

          <article className="reference-shot-card split-visual-study-card">
            <img
              src={SPLIT_SCREEN_REFERENCE.imageSrc}
              alt={SPLIT_SCREEN_REFERENCE.imageAlt}
              className="reference-shot-image split-visual-study-image"
            />
            <div className="reference-shot-copy split-visual-study-copy">
              <p className="eyebrow">Split-Screen Reference</p>
              <h3>{SPLIT_SCREEN_REFERENCE.title}</h3>
              <p>{SPLIT_SCREEN_REFERENCE.summary}</p>
            </div>
          </article>
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

          <article className="reference-shot-card">
            <img
              src={SESSION_SIDEBAR_REFERENCE.imageSrc}
              alt={SESSION_SIDEBAR_REFERENCE.imageAlt}
              className="reference-shot-image"
            />
            <div className="reference-shot-copy">
              <p className="eyebrow">Source Picture</p>
              <h3>{SESSION_SIDEBAR_REFERENCE.title}</h3>
              <p>{SESSION_SIDEBAR_REFERENCE.summary}</p>
            </div>
          </article>

          <div className={`sidebar-mock sidebar-theme-${sidebarThemeMode} session-weight-${sidebarTitleWeight}`}>
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

          <article className="reference-shot-card">
            <img
              src={PLAN_QUESTION_REFERENCE.imageSrc}
              alt={PLAN_QUESTION_REFERENCE.imageAlt}
              className="reference-shot-image"
            />
            <div className="reference-shot-copy">
              <p className="eyebrow">Picture</p>
              <h3>{PLAN_QUESTION_REFERENCE.title}</h3>
              <p>{PLAN_QUESTION_REFERENCE.summary}</p>
            </div>
          </article>
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
              <p>Keep this simple: store symbols, ownership, and dependency notes so Codex starts from stable repo context.</p>
            </div>
          </div>

          <div className="simple-memory-map-grid">
            {MEMORY_MAP_CARDS.map((card) => (
              <article key={card.title} className="simple-memory-card">
                <p className="eyebrow">{card.title}</p>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
