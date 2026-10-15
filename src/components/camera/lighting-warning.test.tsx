import { lightingPoorAtom } from '@/lib/stores/pose-store';
import { act, render, screen } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { LightingWarning } from './lighting-warning';

function renderWithStore(lightingPoor = false) {
  const store = createStore();
  store.set(lightingPoorAtom, lightingPoor);

  const result = render(
    <Provider store={store}>
      <LightingWarning />
    </Provider>
  );

  return { store, ...result };
}

describe('LightingWarning', () => {
  it('renders nothing when lightingPoorAtom is false', () => {
    renderWithStore(false);
    expect(screen.queryByTestId('lighting-warning')).not.toBeInTheDocument();
  });

  it('renders warning when lightingPoorAtom is true', () => {
    renderWithStore(true);
    expect(screen.getByTestId('lighting-warning')).toBeInTheDocument();
    expect(screen.getByText('Try more lighting')).toBeInTheDocument();
  });

  it('has role="status" and aria-live="polite" for accessibility', () => {
    renderWithStore(true);
    const el = screen.getByTestId('lighting-warning');
    expect(el).toHaveAttribute('role', 'status');
    expect(el).toHaveAttribute('aria-live', 'polite');
  });

  it('disappears when atom changes from true to false', () => {
    const { store } = renderWithStore(true);
    expect(screen.getByTestId('lighting-warning')).toBeInTheDocument();

    act(() => {
      store.set(lightingPoorAtom, false);
    });

    expect(screen.queryByTestId('lighting-warning')).not.toBeInTheDocument();
  });

  it('appears when atom changes from false to true', () => {
    const { store } = renderWithStore(false);
    expect(screen.queryByTestId('lighting-warning')).not.toBeInTheDocument();

    act(() => {
      store.set(lightingPoorAtom, true);
    });

    expect(screen.getByTestId('lighting-warning')).toBeInTheDocument();
  });
});
