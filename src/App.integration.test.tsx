import { act, render, screen } from '@testing-library/react';
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
    window.history.replaceState({}, '', '/');
  });

  it('renders Plan Preview Studio as a static picture example', () => {
    render(<App />);

    expect(
      screen.getByRole('img', {
        name: /plan preview studio review image showing a codex-style planning conversation, a thought summary, and a preview card labeled this is how it could look/i
      })
    ).toBeInTheDocument();
    expect(screen.getByText(/fixed plan-review reference/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /generate preview/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: /scenario switcher/i })).not.toBeInTheDocument();
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
