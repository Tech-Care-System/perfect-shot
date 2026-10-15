
import { act, renderHook } from '@testing-library/react';
import { useAtom } from 'jotai';
import { useCamera } from './use-camera';

// Mock Jotai atoms
jest.mock('jotai', () => ({
  ...jest.requireActual('jotai'),
  useAtom: jest.fn(),
  atom: jest.fn(),
}));

jest.mock('@/lib/stores/camera-store', () => ({
  activeStreamAtom: 'activeStreamAtom',
  cameraErrorAtom: 'cameraErrorAtom',
  cameraFacingModeAtom: 'cameraFacingModeAtom',
  cameraPermissionAtom: 'cameraPermissionAtom',
  cameraStatusAtom: 'cameraStatusAtom',
}));

describe('useCamera Hook Stream Management', () => {
    let mockGetUserMedia: jest.Mock;
    let mockEnumerateDevices: jest.Mock;
    
    // Atom setters
    let setPermission: jest.Mock;
    let setError: jest.Mock;
    let setStream: jest.Mock;
    let setStatus: jest.Mock;
    let setFacingMode: jest.Mock;

    beforeEach(() => {
        setPermission = jest.fn();
        setError = jest.fn();
        setStream = jest.fn();
        setStatus = jest.fn();
        setFacingMode = jest.fn();

        // Implementation of useAtom that returns specific state based on atom passed
        (useAtom as jest.Mock).mockImplementation((atom) => {
            if (atom === 'cameraPermissionAtom') return ['prompt', setPermission];
            if (atom === 'cameraErrorAtom') return [null, setError];
            if (atom === 'activeStreamAtom') return [null, setStream];
            if (atom === 'cameraStatusAtom') return ['idle', setStatus];
            if (atom === 'cameraFacingModeAtom') return ['environment', setFacingMode];
            return [null, jest.fn()];
        });
        
        // Mock navigator.mediaDevices
        mockGetUserMedia = jest.fn();
        mockEnumerateDevices = jest.fn();

        Object.defineProperty(global.navigator, 'mediaDevices', {
            value: {
                getUserMedia: mockGetUserMedia,
                enumerateDevices: mockEnumerateDevices,
            },
            writable: true,
        });

        Object.defineProperty(global.navigator, 'permissions', {
            value: {
                query: jest.fn().mockResolvedValue({ state: 'prompt' }),
            },
            writable: true,
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should initialize with atoms', () => {
        const { result } = renderHook(() => useCamera());
        
        expect(result.current.stream).toBeNull();
        expect(result.current.status).toBe('idle');
    });

    it('startCamera should request stream with correct constraints', async () => {
        const mockStream = {
            getTracks: jest.fn().mockReturnValue([]),
        };
        mockGetUserMedia.mockResolvedValue(mockStream);

        const { result } = renderHook(() => useCamera());

        await act(async () => {
            await result.current.startCamera('environment');
        });

        expect(setStatus).toHaveBeenCalledWith('loading');
        expect(setFacingMode).toHaveBeenCalledWith('environment');
        expect(mockGetUserMedia).toHaveBeenCalledWith({
            video: {
                facingMode: 'environment',
                aspectRatio: { ideal: 0.5625 }, // 9/16
            },
            audio: false,
        });
        expect(setStream).toHaveBeenCalledWith(mockStream);
        expect(setStatus).toHaveBeenCalledWith('ready');
    });

    it('stopCamera should clear stream and set status idle', async () => {
        // Setup initial state where stream exists
        const mockStream = {
             getTracks: jest.fn().mockReturnValue([]),
        };
        
        (useAtom as jest.Mock).mockImplementation((atom) => {
            if (atom === 'activeStreamAtom') return [mockStream, setStream];
             if (atom === 'cameraPermissionAtom') return ['prompt', setPermission];
            if (atom === 'cameraErrorAtom') return [null, setError];
            if (atom === 'cameraStatusAtom') return ['ready', setStatus];
            if (atom === 'cameraFacingModeAtom') return ['environment', setFacingMode];
            return [null, jest.fn()];
        });

        const { result } = renderHook(() => useCamera());

        act(() => {
            result.current.stopCamera();
        });

        expect(setStream).toHaveBeenCalledWith(null);
        expect(setStatus).toHaveBeenCalledWith('idle');
    });

    it('should handle start failure', async () => {
         const error = new DOMException('Permission denied', 'NotAllowedError');
         mockGetUserMedia.mockRejectedValue(error);

         const { result } = renderHook(() => useCamera());

         await act(async () => {
             await result.current.startCamera();
         });

         expect(setError).toHaveBeenCalledWith(expect.objectContaining({
             code: 'PERMISSION_DENIED'
         }));
         expect(setStream).toHaveBeenCalledWith(null);
         expect(setStatus).toHaveBeenCalledWith('error');
    });
});
