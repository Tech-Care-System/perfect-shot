import { detectionLostAtom, subjectFramingAtom, subjectTooFarAtom } from '@/lib/stores/pose-store';
import { act, render, screen } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { SubjectFramingWarning } from './subject-framing-warning';

function renderWithStore(framingMessage: string | null = null, tooFar = false, detectionLost = false) {
  const store = createStore();
  store.set(subjectFramingAtom, framingMessage);
  store.set(subjectTooFarAtom, tooFar);
  store.set(detectionLostAtom, detectionLost);

  const result = render(
    <Provider store={store}>
      <SubjectFramingWarning />
    </Provider>
  );

  return { store, ...result };
}

describe('SubjectFramingWarning', () => {
  it('renders nothing when subjectFramingAtom is null', () => {
    renderWithStore(null);
    expect(screen.queryByTestId('subject-framing-warning')).not.toBeInTheDocument();
  });

  it('renders warning with message when subjectFramingAtom is set', () => {
    renderWithStore('Move left to fit in frame');
    expect(screen.getByTestId('subject-framing-warning')).toBeInTheDocument();
    expect(screen.getByText('Move left to fit in frame')).toBeInTheDocument();
  });

  it('renders nothing when subjectTooFarAtom is true (distance takes priority)', () => {
    renderWithStore('Move left to fit in frame', true);
    expect(screen.queryByTestId('subject-framing-warning')).not.toBeInTheDocument();
  });

  it('has role="status" and aria-live="polite" for accessibility', () => {
    renderWithStore('Move right to fit in frame');
    const el = screen.getByTestId('subject-framing-warning');
    expect(el).toHaveAttribute('role', 'status');
    expect(el).toHaveAttribute('aria-live', 'polite');
  });

  it('disappears when framing atom changes to null', () => {
    const { store } = renderWithStore('Move left to fit in frame');
    expect(screen.getByTestId('subject-framing-warning')).toBeInTheDocument();

    act(() => {
      store.set(subjectFramingAtom, null);
    });

    expect(screen.queryByTestId('subject-framing-warning')).not.toBeInTheDocument();
  });

  it('renders nothing when detectionLostAtom is true (detection failure takes priority)', () => {
    renderWithStore('Move left to fit in frame', false, true);
    expect(screen.queryByTestId('subject-framing-warning')).not.toBeInTheDocument();
  });

  it('updates message when framing direction changes', () => {
    const { store } = renderWithStore('Move left to fit in frame');
    expect(screen.getByText('Move left to fit in frame')).toBeInTheDocument();

    act(() => {
      store.set(subjectFramingAtom, 'Move right to fit in frame');
    });

    expect(screen.getByText('Move right to fit in frame')).toBeInTheDocument();
  });
});
