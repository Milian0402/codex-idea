import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('Split screen lab', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('supports changing visible split pane count', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.selectOptions(screen.getByLabelText(/^split panes$/i), '4');

    expect(screen.getAllByLabelText(/pane \d+ prompt/i)).toHaveLength(4);
  });

  it(
    'runs a split pane task and shows visible output stream',
    async () => {
      const user = userEvent.setup();

      render(<App />);

      await user.click(screen.getAllByRole('button', { name: /run mock task/i })[0]);
      expect(screen.getByText(/dispatching prompt to codex workspace/i)).toBeInTheDocument();

      expect(
        await screen.findByText(/rendered prompt and output visible in split pane/i, undefined, { timeout: 3000 })
      ).toBeInTheDocument();
    },
    10000
  );
});
