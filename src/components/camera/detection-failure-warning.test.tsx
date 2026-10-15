import { detectionLostAtom } from '@/lib/stores/pose-store';
import { act, render, screen } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { DetectionFailureWarning } from './detection-failure-warning';

function renderWithStore(detectionLost = false) {
  const store = createStore();
  store.set(detectionLostAtom, detectionLost);

  const result = render(
    <Provider store={store}>
      <DetectionFailureWarning />
    </Provider>
  );

  return { store, ...result };
}

describe('DetectionFailureWarning', () => {
  it('renders nothing when detectionLostAtom is false', () => {
    renderWithStore(false);
    expect(screen.queryByTestId('detection-failure-warning')).not.toBeInTheDocument();
  });

  it('renders warning when detectionLostAtom is true', () => {
    renderWithStore(true);
    expect(screen.getByTestId('detection-failure-warning')).toBeInTheDocument();
  });

  it('displays correct message text', () => {
    renderWithStore(true);
    expect(screen.getByText('Having trouble detecting you. Try better lighting.')).toBeInTheDocument();
  });

  it('has role="status" and aria-live="polite" for accessibility', () => {
    renderWithStore(true);
    const el = screen.getByTestId('detection-failure-warning');
    expect(el).toHaveAttribute('role', 'status');
    expect(el).toHaveAttribute('aria-live', 'polite');
  });

  it('disappears when atom changes from true to false', () => {
    const { store } = renderWithStore(true);
    expect(screen.getByTestId('detection-failure-warning')).toBeInTheDocument();

    act(() => {
      store.set(detectionLostAtom, false);
    });

    expect(screen.queryByTestId('detection-failure-warning')).not.toBeInTheDocument();
  });

  it('appears when atom changes from false to true', () => {
    const { store } = renderWithStore(false);
    expect(screen.queryByTestId('detection-failure-warning')).not.toBeInTheDocument();

    act(() => {
      store.set(detectionLostAtom, true);
    });

    expect(screen.getByTestId('detection-failure-warning')).toBeInTheDocument();
  });
});
