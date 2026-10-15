import { poseScoreAtom, targetPoseAtom } from '@/lib/stores/pose-store';
import { liteModeAtom } from '@/lib/stores/settings-store';
import { act, render, screen } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { FeedbackGlow } from './feedback-glow';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

const MOCK_TARGET: NormalizedLandmark[] = Array.from({ length: 33 }, () => ({
  x: 0.5,
  y: 0.5,
  z: 0,
  visibility: 1,
}));

function renderWithStore(initialScore = 0, target: NormalizedLandmark[] | null = MOCK_TARGET) {
  const store = createStore();
  store.set(poseScoreAtom, initialScore);
  store.set(targetPoseAtom, target);

  const result = render(
    <Provider store={store}>
      <FeedbackGlow />
    </Provider>
  );

  return { store, ...result };
}

describe('FeedbackGlow', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (window.matchMedia as jest.Mock).mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders nothing when targetPoseAtom is null', () => {
    renderWithStore(0.5, null);
    expect(screen.queryByTestId('feedback-glow')).not.toBeInTheDocument();
  });

  it('renders red glow when score < 0.70', () => {
    renderWithStore(0.5);
    const glow = screen.getByTestId('feedback-glow');
    expect(glow).toBeInTheDocument();
    expect(glow).toHaveAttribute('data-glow-state', 'red');
  });

  it('renders yellow glow when score is 0.70-0.89', () => {
    renderWithStore(0.75);
    const glow = screen.getByTestId('feedback-glow');
    expect(glow).toHaveAttribute('data-glow-state', 'yellow');
  });

  it('renders green glow when score >= 0.90', () => {
    renderWithStore(0.95);
    const glow = screen.getByTestId('feedback-glow');
    expect(glow).toHaveAttribute('data-glow-state', 'green');
  });

  it('shows white flash on transition to >= 0.90', () => {
    const { store } = renderWithStore(0.5);

    expect(screen.queryByTestId('match-flash')).not.toBeInTheDocument();

    act(() => {
      store.set(poseScoreAtom, 0.95);
    });
    act(() => {
      jest.advanceTimersByTime(0);
    });

    expect(screen.getByTestId('match-flash')).toBeInTheDocument();
  });

  it('auto-dismisses white flash after 150ms', () => {
    const { store } = renderWithStore(0.5);

    act(() => {
      store.set(poseScoreAtom, 0.95);
    });
    act(() => {
      jest.advanceTimersByTime(0);
    });

    expect(screen.getByTestId('match-flash')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(150);
    });

    expect(screen.queryByTestId('match-flash')).not.toBeInTheDocument();
  });

  it('does NOT re-trigger flash while score stays >= 0.90', () => {
    const { store } = renderWithStore(0.5);

    act(() => {
      store.set(poseScoreAtom, 0.92);
    });
    act(() => {
      jest.advanceTimersByTime(0);
    });

    expect(screen.getByTestId('match-flash')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(150);
    });

    expect(screen.queryByTestId('match-flash')).not.toBeInTheDocument();

    act(() => {
      store.set(poseScoreAtom, 0.95);
    });
    act(() => {
      jest.advanceTimersByTime(0);
    });

    expect(screen.queryByTestId('match-flash')).not.toBeInTheDocument();
  });

  it('re-triggers flash after score drops below 0.90 and crosses back up', () => {
    const { store } = renderWithStore(0.5);

    act(() => {
      store.set(poseScoreAtom, 0.95);
    });
    act(() => {
      jest.advanceTimersByTime(0);
    });
    expect(screen.getByTestId('match-flash')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(screen.queryByTestId('match-flash')).not.toBeInTheDocument();

    act(() => {
      store.set(poseScoreAtom, 0.5);
    });

    act(() => {
      store.set(poseScoreAtom, 0.92);
    });
    act(() => {
      jest.advanceTimersByTime(0);
    });
    expect(screen.getByTestId('match-flash')).toBeInTheDocument();
  });

  it('has correct z-index and pointer-events-none', () => {
    renderWithStore(0.5);
    const glow = screen.getByTestId('feedback-glow');
    expect(glow).toHaveClass('z-20', 'pointer-events-none');
  });

  it('applies yellow pulse animation class', () => {
    renderWithStore(0.75);
    const glow = screen.getByTestId('feedback-glow');
    expect(glow).toHaveClass('animate-pulse');
  });

  it('does not apply pulse animation for non-yellow states', () => {
    renderWithStore(0.5);
    const glow = screen.getByTestId('feedback-glow');
    expect(glow).not.toHaveClass('animate-pulse');
  });

  it('disables transitions when lite mode is active', () => {
    const store = createStore();
    store.set(poseScoreAtom, 0.5);
    store.set(targetPoseAtom, MOCK_TARGET);
    store.set(liteModeAtom, true);

    render(
      <Provider store={store}>
        <FeedbackGlow />
      </Provider>
    );

    const glow = screen.getByTestId('feedback-glow');
    expect(glow.style.transition).toContain('0ms');
  });

  it('disables animate-pulse in lite mode for yellow glow state', () => {
    const store = createStore();
    store.set(poseScoreAtom, 0.75);
    store.set(targetPoseAtom, MOCK_TARGET);
    store.set(liteModeAtom, true);

    render(
      <Provider store={store}>
        <FeedbackGlow />
      </Provider>
    );

    const glow = screen.getByTestId('feedback-glow');
    expect(glow).toHaveAttribute('data-glow-state', 'yellow');
    expect(glow).not.toHaveClass('animate-pulse');
  });

  it('disables transitions when prefers-reduced-motion is enabled without lite mode', () => {
    (window.matchMedia as jest.Mock).mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    const store = createStore();
    store.set(poseScoreAtom, 0.5);
    store.set(targetPoseAtom, MOCK_TARGET);
    store.set(liteModeAtom, false);

    render(
      <Provider store={store}>
        <FeedbackGlow />
      </Provider>
    );

    const glow = screen.getByTestId('feedback-glow');
    expect(glow.style.transition).toContain('0ms');
  });

  it('disables animate-pulse when prefers-reduced-motion is enabled without lite mode', () => {
    (window.matchMedia as jest.Mock).mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    const store = createStore();
    store.set(poseScoreAtom, 0.75);
    store.set(targetPoseAtom, MOCK_TARGET);
    store.set(liteModeAtom, false);

    render(
      <Provider store={store}>
        <FeedbackGlow />
      </Provider>
    );

    const glow = screen.getByTestId('feedback-glow');
    expect(glow).toHaveAttribute('data-glow-state', 'yellow');
    expect(glow).not.toHaveClass('animate-pulse');
  });

  it('uses normal transition duration when lite mode is off', () => {
    const store = createStore();
    store.set(poseScoreAtom, 0.5);
    store.set(targetPoseAtom, MOCK_TARGET);
    store.set(liteModeAtom, false);

    render(
      <Provider store={store}>
        <FeedbackGlow />
      </Provider>
    );

    const glow = screen.getByTestId('feedback-glow');
    expect(glow.style.transition).toContain('300ms');
  });
});
