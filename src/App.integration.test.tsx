import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

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
  });

  it(
    'runs the happy path from seeded plan to simulation completion',
    async () => {
      const user = userEvent.setup();

      render(<App />);

      await user.click(screen.getByRole('button', { name: /mark plan complete/i }));
      await user.click(screen.getByRole('button', { name: /generate preview/i }));
      await user.click(screen.getByRole('button', { name: /approve build/i }));

      expect(await screen.findByRole('status', undefined, { timeout: 8000 })).toHaveTextContent(
        /ready to execute for real/i
      );
    },
    10000
  );

  it(
    'supports revise flow and forces preview regeneration',
    async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /mark plan complete/i }));
    await user.click(screen.getByRole('button', { name: /generate preview/i }));
    await user.click(screen.getByRole('button', { name: /revise plan/i }));

    expect(screen.getByText(/drafting/i)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/regenerate before approving build/i);

    await user.click(screen.getByRole('button', { name: /mark plan complete/i }));
    await user.click(screen.getByRole('button', { name: /generate preview/i }));

    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('button', { name: /approve build/i })).toBeEnabled();
    },
    10000
  );

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
