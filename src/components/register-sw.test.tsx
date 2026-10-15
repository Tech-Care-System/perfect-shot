import { act, render } from '@testing-library/react';
import { RegisterSW } from './register-sw';

describe('RegisterSW', () => {
  const originalDescriptor = Object.getOwnPropertyDescriptor(navigator, 'serviceWorker');

  afterEach(() => {
    if (originalDescriptor) {
      Object.defineProperty(navigator, 'serviceWorker', originalDescriptor);
    }
  });

  it('registers service worker when available', () => {
    const mockRegister = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register: mockRegister },
      writable: true,
      configurable: true,
    });

    render(<RegisterSW />);

    expect(mockRegister).toHaveBeenCalledWith('/sw.js');
  });

  it('catches registration errors silently', async () => {
    const mockRegister = jest.fn().mockRejectedValue(new Error('registration failed'));
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register: mockRegister },
      writable: true,
      configurable: true,
    });

    render(<RegisterSW />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockRegister).toHaveBeenCalledWith('/sw.js');
  });

  it('renders nothing', () => {
    const mockRegister = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register: mockRegister },
      writable: true,
      configurable: true,
    });

    const { container } = render(<RegisterSW />);
    expect(container.innerHTML).toBe('');
  });
});
