import type { WorkerErrorDetail } from '@/lib/types/error.types';
import { detectionErrorAtom, detectionRetrySignalAtom } from '@/lib/stores/pose-store';
import { act, render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { CameraErrorBanner } from './camera-error-banner';

function renderWithStore(error: string | WorkerErrorDetail | null = null) {
  const store = createStore();
  store.set(detectionErrorAtom, error);

  const result = render(
    <Provider store={store}>
      <CameraErrorBanner />
    </Provider>
  );

  return { store, ...result };
}

const LOAD_ERROR: WorkerErrorDetail = { type: 'LOAD_ERROR', rawError: 'Failed to fetch model' };
const RUNTIME_ERROR: WorkerErrorDetail = { type: 'RUNTIME_ERROR', rawError: 'Worker crashed' };

describe('CameraErrorBanner', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders nothing when detectionErrorAtom is null', () => {
    renderWithStore(null);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText(/AI Model/i)).not.toBeInTheDocument();
  });

  describe('load error (WorkerErrorDetail type=LOAD_ERROR)', () => {
    it('shows user-friendly title for load error', () => {
      renderWithStore(LOAD_ERROR);
      expect(screen.getByText('AI Model Failed to Load')).toBeInTheDocument();
    });

    it('shows user-friendly body text for load error', () => {
      renderWithStore(LOAD_ERROR);
      expect(screen.getByText('The AI model could not load. Check your connection and try again.')).toBeInTheDocument();
    });

    it('does NOT show raw error string to user', () => {
      renderWithStore(LOAD_ERROR);
      expect(screen.queryByText('Failed to fetch model')).not.toBeInTheDocument();
    });

    it('shows Retry button for load error', () => {
      renderWithStore(LOAD_ERROR);
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).toHaveClass('min-h-11', 'min-w-11', 'text-base');
    });
  });

  describe('runtime error (WorkerErrorDetail type=RUNTIME_ERROR)', () => {
    it('shows user-friendly title for runtime error', () => {
      renderWithStore(RUNTIME_ERROR);
      expect(screen.getByText('Motion Tracking Error')).toBeInTheDocument();
    });

    it('shows user-friendly body text for runtime error', () => {
      renderWithStore(RUNTIME_ERROR);
      expect(screen.getByText('Motion tracking stopped unexpectedly. Dismiss and try again.')).toBeInTheDocument();
    });

    it('does NOT show raw error string to user', () => {
      renderWithStore(RUNTIME_ERROR);
      expect(screen.queryByText('Worker crashed')).not.toBeInTheDocument();
    });

    it('does NOT show Retry button for runtime error', () => {
      renderWithStore(RUNTIME_ERROR);
      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
    });
  });

  describe('string error', () => {
    it('shows runtime error title for plain string error', () => {
      renderWithStore('Something went wrong');
      expect(screen.getByText('Motion Tracking Error')).toBeInTheDocument();
    });

    it('does NOT show raw string error to user', () => {
      renderWithStore('Something went wrong');
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('does NOT show Retry button for string error', () => {
      renderWithStore('Something went wrong');
      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
    });
  });

  describe('dismiss behaviour', () => {
    it('clears error when dismiss button is clicked', () => {
      const { store } = renderWithStore(RUNTIME_ERROR);
      expect(screen.getByText('Motion Tracking Error')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Dismiss error' }));

      expect(store.get(detectionErrorAtom)).toBeNull();
    });

    it('disappears when detectionErrorAtom is set to null', () => {
      const { store } = renderWithStore(RUNTIME_ERROR);
      expect(screen.getByText('Motion Tracking Error')).toBeInTheDocument();

      act(() => {
        store.set(detectionErrorAtom, null);
      });

      expect(screen.queryByText('Motion Tracking Error')).not.toBeInTheDocument();
    });

    it('positions the opaque alert below the camera header and labels a 44px dismiss target', () => {
      renderWithStore(RUNTIME_ERROR);
      const alert = screen.getByRole('alert');
      const dismissButton = screen.getByRole('button', { name: 'Dismiss error' });

      expect(alert.parentElement).toHaveClass('top-20');
      expect(alert).toHaveClass('bg-stone-950');
      expect(dismissButton).toHaveClass('size-11');
    });
  });

  describe('retry behaviour', () => {
    it('increments detectionRetrySignalAtom when Retry is clicked', () => {
      const { store } = renderWithStore(LOAD_ERROR);
      const initialSignal = store.get(detectionRetrySignalAtom);

      fireEvent.click(screen.getByRole('button', { name: /retry/i }));

      expect(store.get(detectionRetrySignalAtom)).toBe(initialSignal + 1);
    });

    it('shows retrying state while retry is in progress', () => {
      renderWithStore(LOAD_ERROR);

      fireEvent.click(screen.getByRole('button', { name: /retry/i }));

      expect(screen.getByText('Retrying...')).toBeInTheDocument();
    });

    it('clears retrying state after 1 second', () => {
      const { store } = renderWithStore(LOAD_ERROR);

      fireEvent.click(screen.getByRole('button', { name: /retry/i }));
      expect(screen.getByText('Retrying...')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(store.get(detectionErrorAtom)).toBeNull();
    });
  });
});
