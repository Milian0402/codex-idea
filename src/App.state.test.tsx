import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('App state flow', () => {
  it('enables preview generation only after marking plan complete', async () => {
    const user = userEvent.setup();
    render(<App />);

    const generateButton = screen.getByRole('button', { name: /generate preview/i });
    expect(generateButton).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /mark plan complete/i }));

    expect(generateButton).toBeEnabled();
  });

  it('marks preview stale and disables approval after plan edits', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /mark plan complete/i }));
    await user.click(screen.getByRole('button', { name: /generate preview/i }));

    await screen.findByRole('heading', { name: /preview explanation/i });

    const approveButton = screen.getByRole('button', { name: /approve build/i });
    expect(approveButton).toBeEnabled();

    await user.type(screen.getByLabelText(/plan draft/i), '\n7. Add a compact release banner.');

    expect(screen.getByRole('alert')).toHaveTextContent(/regenerate before approving build/i);
    expect(approveButton).toBeDisabled();
  });
});
