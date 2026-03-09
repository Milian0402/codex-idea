import { render, screen } from '@testing-library/react';
import App from './App';

describe('Split screen lab', () => {
  it('shows the large split-screen picture references', () => {
    render(<App />);

    expect(
      screen.getByRole('img', {
        name: /terminal layout study inspired by a multi-terminal codex screenshot, showing three dark panes with visible prompts and responses/i
      })
    ).toBeInTheDocument();
    expect(screen.getByText(/one clear reference based on the shared multi-terminal screenshot/i)).toBeInTheDocument();
  });

  it('does not show the old split pane prompt examples in the visible UI', () => {
    render(<App />);

    expect(screen.queryByRole('heading', { name: /feature build lane/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /refactor lane/i })).not.toBeInTheDocument();
  });
});
