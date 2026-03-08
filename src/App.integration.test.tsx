import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { hashPlanText } from './lib/hash';
import { parsePlanToPreviewSpec } from './lib/planParser';
import { serializeShareState } from './lib/shareState';
import type { ShareState } from './types';

const setWindowWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width
  });
};

describe('App integration scenarios', () => {
  afterEach(() => {
    vi.useRealTimers();
    window.history.replaceState({}, '', '/');
  });

  it(
    'supports scenario switch and generates an approval artifact',
    async () => {
      const user = userEvent.setup();

      render(<App />);

      await user.selectOptions(screen.getByLabelText(/scenario switcher/i), 'dashboard-ui');
      expect((screen.getByLabelText(/user goal/i) as HTMLTextAreaElement).value).toContain(
        'stakeholders before implementation'
      );

      await user.click(screen.getByRole('button', { name: /mark plan complete/i }));
      await user.click(screen.getByRole('button', { name: /generate preview/i }));

      await screen.findByRole('heading', { name: /preview explanation/i }, { timeout: 10000 });

      await user.click(screen.getByRole('button', { name: /approve build/i }));

      await screen.findByText(/simulation complete/i, undefined, { timeout: 10000 });

      expect(screen.getByRole('status')).toHaveTextContent(/ready to execute for real/i);
      expect(screen.getByRole('heading', { name: /approval artifact/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /export artifact json/i })).toBeEnabled();
    },
    15000
  );

  it('restores preview-ready state from deep link', () => {
    const planText = 'Product: Linked Demo\nScreen: Shared Workspace\nTone: clean and simple';
    const spec = parsePlanToPreviewSpec(planText);

    const sharedState: ShareState = {
      scenarioId: 'simple-ui',
      session: {
        id: 'shared-session',
        userGoal: 'Test deep link restore',
        planText,
        status: 'preview_ready',
        updatedAt: '2026-03-08T12:00:00.000Z'
      },
      generatedPreview: {
        generatedAt: '2026-03-08T12:00:00.000Z',
        sourcePlanHash: hashPlanText(planText),
        spec
      },
      previewInvalidated: false
    };

    const encoded = serializeShareState(sharedState);
    window.history.replaceState({}, '', `/?state=${encoded}`);

    render(<App />);

    expect(screen.getByText(/preview ready/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /preview explanation/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/scenario switcher/i)).toHaveValue('simple-ui');
  });

  it('switches viewport mode label when resized', async () => {
    setWindowWidth(1280);
    const { container } = render(<App />);

    const shell = container.querySelector('.app-shell');
    expect(shell).toHaveAttribute('data-viewport-mode', 'desktop');

    setWindowWidth(760);
    await act(async () => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(shell).toHaveAttribute('data-viewport-mode', 'mobile');
  });
});
