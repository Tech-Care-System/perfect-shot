import { poseHintAtom } from '@/lib/stores/pose-store';
import type { PoseHint } from '@/lib/types/pose.types';
import { render, screen } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { PoseHintCard } from './pose-hint-card';

function renderWithStore(hint: PoseHint | null = null) {
  const store = createStore();
  store.set(poseHintAtom, hint);

  const result = render(
    <Provider store={store}>
      <PoseHintCard />
    </Provider>
  );

  return { store, ...result };
}

describe('PoseHintCard', () => {
  it('renders nothing when poseHintAtom is null', () => {
    renderWithStore(null);
    expect(screen.queryByTestId('pose-hint-card')).not.toBeInTheDocument();
  });

  it('renders pose name and action hint with correct styling', () => {
    renderWithStore({ name: 'Confident Sit', hint: 'Lean back, arm on armrest' });
    const nameEl = screen.getByText('Confident Sit');
    const hintEl = screen.getByText('Lean back, arm on armrest');
    expect(nameEl).toBeInTheDocument();
    expect(hintEl).toBeInTheDocument();
    expect(nameEl).toHaveClass('text-xl', 'font-semibold', 'text-white');
    expect(hintEl).toHaveClass('text-sm', 'text-neutral-400');
  });

  it('card has correct z-index, positioning, and pointer-events-none', () => {
    renderWithStore({ name: 'Test', hint: 'Test hint' });
    const card = screen.getByTestId('pose-hint-card');
    expect(card).toHaveClass('z-50', 'pointer-events-none', 'bottom-24', 'left-1/2', '-translate-x-1/2');
  });

  it('card has aria-live="polite" and role="status"', () => {
    renderWithStore({ name: 'Test', hint: 'Test hint' });
    const card = screen.getByTestId('pose-hint-card');
    expect(card).toHaveAttribute('aria-live', 'polite');
    expect(card).toHaveAttribute('role', 'status');
  });
});
