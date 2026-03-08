import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('Sidebar concept section', () => {
  it('shows thread descriptions and can hide them', async () => {
    const user = userEvent.setup();
    render(<App />);

    const description = 'Created MVP concept repo and scaffolded demo flow before implementation.';
    expect(screen.getByText(description)).toBeInTheDocument();

    await user.click(screen.getByLabelText(/show thread descriptions/i));

    expect(screen.queryByText(description)).toBeNull();
  });

  it('updates color mode and font weight classes', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    const sidebarMock = container.querySelector('.sidebar-mock');
    expect(sidebarMock).toHaveClass('sidebar-theme-terminal');
    expect(sidebarMock).toHaveClass('session-weight-medium');

    await user.selectOptions(screen.getByLabelText(/sidebar color mode/i), 'slate');
    await user.selectOptions(screen.getByLabelText(/thread font weight/i), 'semibold');

    expect(sidebarMock).toHaveClass('sidebar-theme-slate');
    expect(sidebarMock).toHaveClass('session-weight-semibold');
  });
});
