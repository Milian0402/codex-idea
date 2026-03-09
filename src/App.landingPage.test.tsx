import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('Landing page navigation', () => {
  afterEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('lets users navigate between idea cards from the landing page', async () => {
    const user = userEvent.setup();
    render(<App />);

    const memoryMapButton = screen.getByRole('button', { name: /open codebase memory map/i });
    const planPreviewButton = screen.getByRole('button', { name: /open plan preview studio/i });

    await user.click(memoryMapButton);

    expect(memoryMapButton).toHaveAttribute('aria-pressed', 'true');
    expect(planPreviewButton).toHaveAttribute('aria-pressed', 'false');
    expect(window.location.hash).toBe('#idea-memory-map');
  });

  it('shows the simpler memory map summary content', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /open codebase memory map/i }));

    expect(
      screen.getByText((content, element) => element?.tagName.toLowerCase() === 'p' && /^symbols$/i.test(content))
    ).toBeInTheDocument();
    expect(
      screen.getByText((content, element) => element?.tagName.toLowerCase() === 'p' && /^dependencies$/i.test(content))
    ).toBeInTheDocument();
    expect(
      screen.getByText((content, element) => element?.tagName.toLowerCase() === 'p' && /^ownership$/i.test(content))
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /selected cluster/i })).not.toBeInTheDocument();
  });
});
