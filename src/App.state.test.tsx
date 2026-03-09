import { render, screen } from '@testing-library/react';
import App from './App';

describe('App README coverage', () => {
  it('surfaces the README-only picture concepts in the landing navigation', () => {
    render(<App />);

    expect(screen.getByRole('button', { name: /open chrome-like session tabs/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open trusted repo auto-open/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open phone emulator should be easier/i })).toBeInTheDocument();
  });

  it('keeps the linked repo screenshots in their matching concept sections', () => {
    render(<App />);

    expect(
      screen.getAllByRole('img', {
        name: /screenshot of the contextual threads repo showing a dark session sidebar next to a conversation view/i
      })
    ).toHaveLength(1);
    expect(
      screen.getAllByRole('img', {
        name: /screenshot of the info bubble helper repo showing a question card with an explanatory info tooltip/i
      })
    ).toHaveLength(1);
  });
});
