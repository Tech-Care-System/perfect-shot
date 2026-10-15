
import { useCamera } from '@/lib/hooks/use-camera';
import { videoElementAtom } from '@/lib/stores/camera-store';
import { render, screen, act } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import type { ReactNode } from 'react';
import { CameraPreview } from './camera-preview';

jest.mock('@/lib/hooks/use-camera', () => ({
  useCamera: jest.fn(),
}));

jest.mock('@/lib/hooks/use-pose-detection', () => ({
  usePoseDetection: jest.fn().mockReturnValue({
    startDetection: jest.fn(),
    stopDetection: jest.fn(),
    workerStatus: 'idle',
    error: null,
  }),
}));

jest.mock('./pose-status-overlay', () => ({
  PoseStatusOverlay: () => null,
}));

jest.mock('./wireframe-canvas', () => ({
  WireframeCanvas: () => null,
}));

function createWrapper(store: ReturnType<typeof createStore>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  };
}

describe('CameraPreview Component', () => {
    let mockStream: MediaStream;
    let store: ReturnType<typeof createStore>;

    beforeEach(() => {
        store = createStore();
        mockStream = {
            id: 'mock-stream',
            active: true,
            getTracks: jest.fn().mockReturnValue([]),
        } as unknown as MediaStream;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should render a video element', () => {
        (useCamera as jest.Mock).mockReturnValue({
            stream: mockStream,
            facingMode: 'environment',
        });
        
        render(<CameraPreview />, { wrapper: createWrapper(store) });
        const video = screen.getByTestId('camera-video');
        expect(video).toBeInTheDocument();
        expect(video.tagName).toBe('VIDEO');
    });

    it('should NOT be mirrored when facingMode is environment', () => {
        (useCamera as jest.Mock).mockReturnValue({
            stream: mockStream,
            facingMode: 'environment',
        });

         render(<CameraPreview />, { wrapper: createWrapper(store) });
         const video = screen.getByTestId('camera-video');
         expect(video).not.toHaveClass('scale-x-[-1]');
    });

    it('should BE mirrored when facingMode is user', () => {
        (useCamera as jest.Mock).mockReturnValue({
            stream: mockStream,
            facingMode: 'user',
        });

         render(<CameraPreview />, { wrapper: createWrapper(store) });
         const video = screen.getByTestId('camera-video');
         expect(video).toHaveClass('scale-x-[-1]');
    });

    it('should set videoElementAtom when video metadata loads', () => {
        (useCamera as jest.Mock).mockReturnValue({
            stream: mockStream,
            facingMode: 'environment',
            status: 'ready',
        });

        render(<CameraPreview />, { wrapper: createWrapper(store) });
        const video = screen.getByTestId('camera-video') as HTMLVideoElement;

        act(() => {
          if (video.onloadedmetadata) {
            (video.onloadedmetadata as EventListener)(new Event('loadedmetadata'));
          }
        });

        expect(store.get(videoElementAtom)).toBe(video);
    });

    it('should clear videoElementAtom when stream is removed', () => {
        (useCamera as jest.Mock).mockReturnValue({
            stream: mockStream,
            facingMode: 'environment',
            status: 'ready',
        });

        const { rerender } = render(<CameraPreview />, { wrapper: createWrapper(store) });
        const video = screen.getByTestId('camera-video') as HTMLVideoElement;

        act(() => {
          if (video.onloadedmetadata) {
            (video.onloadedmetadata as EventListener)(new Event('loadedmetadata'));
          }
        });
        expect(store.get(videoElementAtom)).toBe(video);

        (useCamera as jest.Mock).mockReturnValue({
            stream: null,
            facingMode: 'environment',
            status: 'idle',
        });

        rerender(<CameraPreview />);
        expect(store.get(videoElementAtom)).toBeNull();
    });
});
