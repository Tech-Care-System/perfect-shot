import { deviceUnsupportedAtom, deviceWarningDismissedAtom } from '@/lib/stores/settings-store';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { UnsupportedDeviceWarning } from './unsupported-device-warning';

function renderWithStore(deviceUnsupported = false, dismissed = false) {
  const store = createStore();
  store.set(deviceUnsupportedAtom, deviceUnsupported);
  store.set(deviceWarningDismissedAtom, dismissed);

  const result = render(
    <Provider store={store}>
      <UnsupportedDeviceWarning />
    </Provider>
  );

  return { store, ...result };
}

describe('UnsupportedDeviceWarning', () => {
  it('renders nothing when deviceUnsupportedAtom is false', () => {
    renderWithStore(false);
    expect(screen.queryByTestId('unsupported-device-warning')).not.toBeInTheDocument();
  });

  it('renders warning when deviceUnsupportedAtom is true and not dismissed', () => {
    renderWithStore(true);
    expect(screen.getByTestId('unsupported-device-warning')).toBeInTheDocument();
    expect(
      screen.getByText('Your device may have slower feedback. For best results, use the manual shutter button.')
    ).toBeInTheDocument();
  });

  it('renders nothing when deviceUnsupportedAtom is true but dismissed', () => {
    renderWithStore(true, true);
    expect(screen.queryByTestId('unsupported-device-warning')).not.toBeInTheDocument();
  });

  it('dismisses warning when dismiss button is clicked', () => {
    const { store } = renderWithStore(true);
    expect(screen.getByTestId('unsupported-device-warning')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('unsupported-device-dismiss'));

    expect(store.get(deviceWarningDismissedAtom)).toBe(true);
    expect(screen.queryByTestId('unsupported-device-warning')).not.toBeInTheDocument();
  });

  it('has role="status" and aria-live="polite" for accessibility', () => {
    renderWithStore(true);
    const el = screen.getByTestId('unsupported-device-warning');
    expect(el).toHaveAttribute('role', 'status');
    expect(el).toHaveAttribute('aria-live', 'polite');
    expect(el).toHaveClass('top-[194px]', 'left-4', 'right-4');
    expect(
      screen.getByText('Your device may have slower feedback. For best results, use the manual shutter button.')
    ).toHaveClass('text-base');
  });

  it('dismiss button has aria-label="Dismiss warning"', () => {
    renderWithStore(true);
    const btn = screen.getByTestId('unsupported-device-dismiss');
    expect(btn).toHaveAttribute('aria-label', 'Dismiss warning');
    expect(btn).toHaveClass('size-11');
  });

  it('has pointer-events-none class on container', () => {
    renderWithStore(true);
    const el = screen.getByTestId('unsupported-device-warning');
    expect(el).toHaveClass('pointer-events-none');
  });

  it('disappears when deviceUnsupportedAtom changes to false', () => {
    const { store } = renderWithStore(true);
    expect(screen.getByTestId('unsupported-device-warning')).toBeInTheDocument();

    act(() => {
      store.set(deviceUnsupportedAtom, false);
    });

    expect(screen.queryByTestId('unsupported-device-warning')).not.toBeInTheDocument();
  });
});
