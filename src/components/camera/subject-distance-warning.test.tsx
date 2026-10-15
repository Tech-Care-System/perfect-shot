import { detectionLostAtom, subjectTooFarAtom } from '@/lib/stores/pose-store';
import { act, render, screen } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { SubjectDistanceWarning } from './subject-distance-warning';

function renderWithStore(tooFar = false, detectionLost = false) {
  const store = createStore();
  store.set(subjectTooFarAtom, tooFar);
  store.set(detectionLostAtom, detectionLost);

  const result = render(
    <Provider store={store}>
      <SubjectDistanceWarning />
    </Provider>
  );

  return { store, ...result };
}

describe('SubjectDistanceWarning', () => {
  it('renders nothing when subjectTooFarAtom is false', () => {
    renderWithStore(false);
    expect(screen.queryByTestId('subject-distance-warning')).not.toBeInTheDocument();
  });

  it('renders warning when subjectTooFarAtom is true', () => {
    renderWithStore(true);
    expect(screen.getByTestId('subject-distance-warning')).toBeInTheDocument();
    expect(screen.getByText('Step closer to the camera')).toBeInTheDocument();
  });

  it('has role="status" and aria-live="polite" for accessibility', () => {
    renderWithStore(true);
    const el = screen.getByTestId('subject-distance-warning');
    expect(el).toHaveAttribute('role', 'status');
    expect(el).toHaveAttribute('aria-live', 'polite');
  });

  it('disappears when atom changes from true to false', () => {
    const { store } = renderWithStore(true);
    expect(screen.getByTestId('subject-distance-warning')).toBeInTheDocument();

    act(() => {
      store.set(subjectTooFarAtom, false);
    });

    expect(screen.queryByTestId('subject-distance-warning')).not.toBeInTheDocument();
  });

  it('appears when atom changes from false to true', () => {
    const { store } = renderWithStore(false);
    expect(screen.queryByTestId('subject-distance-warning')).not.toBeInTheDocument();

    act(() => {
      store.set(subjectTooFarAtom, true);
    });

    expect(screen.getByTestId('subject-distance-warning')).toBeInTheDocument();
  });

  it('renders nothing when detectionLostAtom is true (detection failure takes priority)', () => {
    renderWithStore(true, true);
    expect(screen.queryByTestId('subject-distance-warning')).not.toBeInTheDocument();
  });
});
