import { detectionLostAtom, poseCorrectionAtom, subjectFramingAtom, targetPoseAtom } from '@/lib/stores/pose-store';
import { act, render, screen } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { PoseCorrectionPrompt } from './pose-correction-prompt';

const MOCK_TARGET: NormalizedLandmark[] = Array.from({ length: 33 }, () => ({
  x: 0.5,
  y: 0.5,
  z: 0,
  visibility: 1,
}));

function renderWithStore(correction: string | null = null, target: NormalizedLandmark[] | null = MOCK_TARGET) {
  const store = createStore();
  store.set(poseCorrectionAtom, correction);
  store.set(targetPoseAtom, target);

  const result = render(
    <Provider store={store}>
      <PoseCorrectionPrompt />
    </Provider>
  );

  return { store, ...result };
}

describe('PoseCorrectionPrompt', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders nothing when targetPoseAtom is null', () => {
    renderWithStore('Raise your arms higher', null);
    expect(screen.queryByTestId('pose-correction-prompt')).not.toBeInTheDocument();
  });

  it('renders nothing when poseCorrectionAtom is null', () => {
    renderWithStore(null);
    expect(screen.queryByTestId('pose-correction-prompt')).not.toBeInTheDocument();
  });

  it('renders correction text when poseCorrectionAtom has a string', () => {
    renderWithStore('Raise your arms higher');
    act(() => {
      jest.advanceTimersByTime(0);
    });
    expect(screen.getByText('Raise your arms higher')).toBeInTheDocument();
  });

  it('has aria-live="polite" and role="status"', () => {
    renderWithStore('Raise your arms higher');
    act(() => {
      jest.advanceTimersByTime(0);
    });
    const prompt = screen.getByTestId('pose-correction-prompt');
    expect(prompt).toHaveAttribute('aria-live', 'polite');
    expect(prompt).toHaveAttribute('role', 'status');
  });

  it('holds displayed text for 1 second before switching', () => {
    const { store } = renderWithStore('Raise your arms higher');
    act(() => {
      jest.advanceTimersByTime(0);
    });
    expect(screen.getByText('Raise your arms higher')).toBeInTheDocument();

    jest.advanceTimersByTime(500);

    act(() => {
      store.set(poseCorrectionAtom, 'Level your shoulders');
    });

    expect(screen.getByText('Raise your arms higher')).toBeInTheDocument();
    expect(screen.queryByText('Level your shoulders')).not.toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(screen.getByText('Level your shoulders')).toBeInTheDocument();
  });

  it('shows deferred correction after hold period when value stabilizes', () => {
    const { store } = renderWithStore('Raise your arms higher');
    act(() => {
      jest.advanceTimersByTime(0);
    });
    expect(screen.getByText('Raise your arms higher')).toBeInTheDocument();

    jest.advanceTimersByTime(300);

    act(() => {
      store.set(poseCorrectionAtom, 'Sit up straighter');
    });

    expect(screen.getByText('Raise your arms higher')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(700);
    });

    expect(screen.getByText('Sit up straighter')).toBeInTheDocument();
  });

  it('renders nothing when subjectFramingAtom is non-null', () => {
    const store = createStore();
    store.set(poseCorrectionAtom, 'Raise your arms higher');
    store.set(targetPoseAtom, MOCK_TARGET);
    store.set(subjectFramingAtom, 'Move left to fit in frame');

    render(
      <Provider store={store}>
        <PoseCorrectionPrompt />
      </Provider>
    );

    expect(screen.queryByTestId('pose-correction-prompt')).not.toBeInTheDocument();
  });

  it('renders nothing when detectionLostAtom is true (detection failure takes priority)', () => {
    const store = createStore();
    store.set(poseCorrectionAtom, 'Raise your arms higher');
    store.set(targetPoseAtom, MOCK_TARGET);
    store.set(detectionLostAtom, true);

    render(
      <Provider store={store}>
        <PoseCorrectionPrompt />
      </Provider>
    );

    expect(screen.queryByTestId('pose-correction-prompt')).not.toBeInTheDocument();
  });
});
