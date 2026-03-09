import { render, screen } from '@testing-library/react';
import App from './App';

describe('Pull request company skills concept', () => {
  it('renders a simpler where-to-change-the-skill summary', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /pull request company skills radar/i })).toBeInTheDocument();
    expect(screen.getByText(/where to change the actual skill/i)).toBeInTheDocument();
  });

  it('shows short guidance instead of the dense dashboard as visible content', () => {
    render(<App />);

    expect(screen.getByText(/improve the shared review skill and make it easier to adopt across the team/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /team snapshot/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /suggested changes/i })).not.toBeInTheDocument();
  });
});
