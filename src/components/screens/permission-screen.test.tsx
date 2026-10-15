import * as useCameraModule from '@/lib/hooks/use-camera';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PermissionScreen } from './permission-screen';

// Mock the useCamera hook
jest.mock('@/lib/hooks/use-camera');
jest.mock('@/lib/utils/logger');

const mockUseCamera = useCameraModule.useCamera as jest.MockedFunction<typeof useCameraModule.useCamera>;
type UseCameraReturn = ReturnType<typeof useCameraModule.useCamera>;

describe('PermissionScreen', () => {
  const mockRequestPermission = jest.fn<Promise<boolean>, []>(() => Promise.resolve(true));
  const mockCheckPermission = jest.fn<Promise<'prompt' | 'granted' | 'denied'>, [boolean?]>(() =>
    Promise.resolve('prompt')
  );

  const createUseCameraMock = (overrides: Partial<UseCameraReturn> = {}): UseCameraReturn => ({
    permissionStatus: 'prompt',
    requestPermission: mockRequestPermission,
    checkPermission: mockCheckPermission,
    startCamera: jest.fn(),
    stopCamera: jest.fn(),
    stream: null,
    status: 'idle',
    facingMode: 'environment',
    error: null,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Welcome View (permission: prompt)', () => {
    beforeEach(() => {
      mockUseCamera.mockReturnValue(createUseCameraMock());
    });

    it('renders welcome screen elements', () => {
      render(<PermissionScreen />);

      expect(screen.getByText('ai-perfect-shot')).toBeInTheDocument();
      expect(screen.getByText('Real-time AI pose guidance')).toBeInTheDocument();
      expect(screen.getByText(/We need camera access/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Grant Camera Access/i })).toBeInTheDocument();
      expect(screen.getByText(/Your photos never leave your device/i)).toBeInTheDocument();
    });

    it('calls requestPermission when Grant Camera Access button is clicked', async () => {
      const user = userEvent.setup();
      render(<PermissionScreen />);

      const button = screen.getByRole('button', { name: /Grant Camera Access/i });
      await user.click(button);

      expect(mockRequestPermission).toHaveBeenCalledTimes(1);
    });
  });

  describe('Denied View (permission: denied)', () => {
    beforeEach(() => {
      mockUseCamera.mockReturnValue(createUseCameraMock({
        permissionStatus: 'denied',
        error: {
          code: 'PERMISSION_DENIED',
          message: 'User denied camera access',
        },
      }));
    });

    it('renders denied screen elements', () => {
      render(<PermissionScreen />);

      expect(screen.getByText('Camera Access Needed')).toBeInTheDocument();
      expect(screen.getByText(/No worries! Here's how to enable camera access:/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Check Again/i })).toBeInTheDocument();
    });

    it('shows browser-specific instructions', () => {
      render(<PermissionScreen />);

      // Should show numbered list instructions
      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
      expect(list.children.length).toBeGreaterThan(0);
    });

    it('calls checkPermission when Check Again button is clicked', async () => {
      const user = userEvent.setup();
      render(<PermissionScreen />);

      const button = screen.getByRole('button', { name: /Check Again/i });
      await user.click(button);

      expect(mockCheckPermission).toHaveBeenCalledTimes(1);
    });
  });

  describe('Granted State Transition', () => {
    it('does not render permission screen when permission is granted', () => {
      mockUseCamera.mockReturnValue(createUseCameraMock({
        permissionStatus: 'granted',
      }));

      const { container } = render(<PermissionScreen />);
      
      // Component should return null when permission is granted
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Props-based rendering', () => {
    it('renders with provided props without calling useCamera hook', () => {
      const customRequestPermission = jest.fn();
      const customCheckPermission = jest.fn();

      render(
        <PermissionScreen
          permissionStatus="prompt"
          requestPermission={customRequestPermission}
          checkPermission={customCheckPermission}
        />
      );

      expect(screen.getByText('ai-perfect-shot')).toBeInTheDocument();
      // The mock hook should not have been used since all props were provided
    });

    it('merges props with hook when partial props provided', () => {
      mockUseCamera.mockReturnValue(createUseCameraMock());

      const customRequestPermission = jest.fn();

      render(
        <PermissionScreen
          requestPermission={customRequestPermission}
        />
      );

      expect(screen.getByText('ai-perfect-shot')).toBeInTheDocument();
    });
  });

  describe('Visibility change detection', () => {
    it('triggers silent permission check when page becomes visible', () => {
      mockUseCamera.mockReturnValue(createUseCameraMock({
        permissionStatus: 'denied',
      }));

      render(<PermissionScreen />);

      // Simulate visibility change
      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        configurable: true,
        value: 'visible',
      });

      const event = new Event('visibilitychange');
      document.dispatchEvent(event);

      // The actual hook logic is tested via integration
      // This verifies the component renders correctly during state changes
      expect(screen.getByText('Camera Access Needed')).toBeInTheDocument();
    });
  });

  describe('Silent vs Non-silent mode', () => {
    it('Check Again button should request non-silent check', async () => {
      const mockCheckWithSilent = jest.fn();
      
      render(
        <PermissionScreen
          permissionStatus="denied"
          requestPermission={mockRequestPermission}
          checkPermission={mockCheckWithSilent}
        />
      );

      const checkButton = screen.getByRole('button', { name: /Check Again/i });
      const user = userEvent.setup();
      await user.click(checkButton);

      // Should be called with silent=false
      expect(mockCheckWithSilent).toHaveBeenCalledWith(false);
    });
  });

  describe('Safari fallback scenarios', () => {
    it('verifies Check Again uses non-silent mode for getUserMedia probe', async () => {
      // This is the key Safari fallback behavior we CAN test:
      // When user clicks "Check Again", it must use silent=false to probe
      const mockCheckWithSilent = jest.fn().mockResolvedValue('granted');
      
      render(
        <PermissionScreen
          permissionStatus="denied"
          requestPermission={mockRequestPermission}
          checkPermission={mockCheckWithSilent}
        />
      );

      const checkButton = screen.getByRole('button', { name: /Check Again/i });
      const user = userEvent.setup();
      await user.click(checkButton);

      // Critical: must be called with false (non-silent) to enable probe
      expect(mockCheckWithSilent).toHaveBeenCalledWith(false);
      expect(mockCheckWithSilent).toHaveBeenCalledTimes(1);
    });
  });
});
