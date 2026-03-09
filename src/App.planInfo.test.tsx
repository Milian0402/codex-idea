import { render, screen } from '@testing-library/react';
import App from './App';

describe('Plan question concept', () => {
  it('shows the screenshot and a brief explanation', () => {
    render(<App />);

    expect(
      screen.getAllByRole('img', {
        name: /screenshot reference showing a question card with an explanatory info tooltip/i
      })
    ).toHaveLength(1);
    expect(
      screen.getByText(/the second info button explains why the question exists, so the prompt feels clearer before the user answers/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /explain why this mock asks it/i })).not.toBeInTheDocument();
  });
});
