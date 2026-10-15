import { cameraFacingModeAtom, cameraFitModeAtom } from '@/lib/stores/camera-store';
import { poseResultAtom, targetPoseAtom } from '@/lib/stores/pose-store';
import { act, render, screen } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { WireframeCanvas } from './wireframe-canvas';

function createContextMock() {
  return {
    canvas: { width: 0, height: 0 },
    save: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    closePath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    quadraticCurveTo: jest.fn(),
    bezierCurveTo: jest.fn(),
    stroke: jest.fn(),
    clearRect: jest.fn(),
    arc: jest.fn(),
    ellipse: jest.fn(),
    fill: jest.fn(),
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 0,
    shadowColor: '',
    shadowBlur: 0,
    lineCap: 'butt',
    lineJoin: 'miter',
  } as unknown as CanvasRenderingContext2D;
}

describe('WireframeCanvas Component', () => {
  const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  const originalResizeObserver = global.ResizeObserver;
  let context: CanvasRenderingContext2D;
  let parentWidth = 320;
  let parentHeight = 240;
  let resizeObserverCallback: ResizeObserverCallback | null = null;

  beforeEach(() => {
    context = createContextMock();
    parentWidth = 320;
    parentHeight = 240;
    resizeObserverCallback = null;

    class MockResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        resizeObserverCallback = callback;
      }

      observe = jest.fn();
      unobserve = jest.fn();
      disconnect = jest.fn();
    }

    Object.defineProperty(global, 'ResizeObserver', {
      value: MockResizeObserver,
      configurable: true,
      writable: true,
    });

    jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
      width: parentWidth,
      height: parentHeight,
      top: 0,
      left: 0,
      right: parentWidth,
      bottom: parentHeight,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }));

    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement) {
      (context as { canvas: HTMLCanvasElement }).canvas = this;
      return context;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    HTMLCanvasElement.prototype.getContext = originalGetContext;
    if (originalResizeObserver) {
      Object.defineProperty(global, 'ResizeObserver', {
        value: originalResizeObserver,
        configurable: true,
        writable: true,
      });
    } else {
      Reflect.deleteProperty(global, 'ResizeObserver');
    }
  });

  it('renders a canvas with overlay classes', () => {
    render(
      <div className="relative h-[240px] w-[320px]">
        <WireframeCanvas />
      </div>
    );

    const canvas = screen.getByTestId('wireframe-canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveClass('absolute', 'inset-0', 'h-full', 'w-full', 'z-10');
    expect((canvas as HTMLCanvasElement).width).toBe(320);
    expect((canvas as HTMLCanvasElement).height).toBe(240);
  });

  it('draws a white body silhouette for the selected target pose', () => {
    const store = createStore();
    store.set(cameraFacingModeAtom, 'user');
    const targetPose = Array.from({ length: 33 }, (_, index) => ({
      x: (index + 1) / 40,
      y: (index + 1) / 50,
      z: 0,
      visibility: 1,
    }));

    store.set(targetPoseAtom, targetPose);

    render(
      <Provider store={store}>
        <div className="relative h-[240px] w-[320px]">
          <WireframeCanvas />
        </div>
      </Provider>
    );

    const canvas = screen.getByTestId('wireframe-canvas');
    expect(canvas).toHaveClass('scale-x-[-1]');
    expect(context.clearRect).toHaveBeenCalledWith(0, 0, 320, 240);
    expect(context.ellipse).toHaveBeenCalledTimes(2);
    expect(context.fill).toHaveBeenCalled();
    expect(context.stroke).toHaveBeenCalled();
    expect(context.arc).not.toHaveBeenCalled();
  });

  it('redraws the selected pose when the canvas parent is resized', () => {
    const store = createStore();
    const targetPose = Array.from({ length: 33 }, (_, index) => ({
      x: (index + 1) / 40,
      y: (index + 1) / 50,
      z: 0,
      visibility: 1,
    }));
    store.set(targetPoseAtom, targetPose);

    render(
      <Provider store={store}>
        <div className="relative h-[240px] w-[320px]">
          <WireframeCanvas />
        </div>
      </Provider>
    );

    const canvas = screen.getByTestId('wireframe-canvas') as HTMLCanvasElement;
    (context.clearRect as jest.Mock).mockClear();
    (context.ellipse as jest.Mock).mockClear();
    (context.fill as jest.Mock).mockClear();
    parentWidth = 480;
    parentHeight = 360;

    act(() => resizeObserverCallback?.([], {} as ResizeObserver));

    expect(canvas.width).toBe(480);
    expect(canvas.height).toBe(360);
    expect(context.clearRect).toHaveBeenCalledWith(0, 0, 480, 360);
    expect(context.ellipse).toHaveBeenCalledTimes(2);
    expect(context.fill).toHaveBeenCalled();
  });

  it('updates object-fit mapping on video metadata and dimension changes', () => {
    const store = createStore();
    store.set(cameraFitModeAtom, 'contain');
    store.set(targetPoseAtom, Array.from({ length: 33 }, (_, index) => ({
      x: (index + 1) / 40,
      y: (index + 1) / 50,
      z: 0,
      visibility: 1,
    })));

    render(
      <Provider store={store}>
        <div>
          <video data-testid="camera-video" />
          <WireframeCanvas />
        </div>
      </Provider>
    );
    const video = screen.getByTestId('camera-video');
    Object.defineProperty(video, 'videoWidth', { configurable: true, value: 0 });
    Object.defineProperty(video, 'videoHeight', { configurable: true, value: 0 });
    const initialHeadY = (context.ellipse as jest.Mock).mock.calls[0]![1] as number;

    Object.defineProperty(video, 'videoWidth', { configurable: true, value: 640 });
    Object.defineProperty(video, 'videoHeight', { configurable: true, value: 360 });
    (context.ellipse as jest.Mock).mockClear();
    act(() => video.dispatchEvent(new Event('loadedmetadata')));
    const metadataHeadY = (context.ellipse as jest.Mock).mock.calls[0]![1] as number;

    Object.defineProperty(video, 'videoWidth', { configurable: true, value: 640 });
    Object.defineProperty(video, 'videoHeight', { configurable: true, value: 480 });
    (context.ellipse as jest.Mock).mockClear();
    act(() => video.dispatchEvent(new Event('resize')));
    const resizedHeadY = (context.ellipse as jest.Mock).mock.calls[0]![1] as number;

    expect(metadataHeadY).not.toBeCloseTo(initialHeadY);
    expect(resizedHeadY).not.toBeCloseTo(metadataHeadY);
    expect(context.ellipse).toHaveBeenCalledTimes(2);
  });

  it('clears canvas and skips drawing when no pose is detected', () => {
    const store = createStore();
    store.set(cameraFacingModeAtom, 'environment');
    store.set(poseResultAtom, null);

    render(
      <Provider store={store}>
        <div className="relative h-[240px] w-[320px]">
          <WireframeCanvas />
        </div>
      </Provider>
    );

    const canvas = screen.getByTestId('wireframe-canvas');
    expect(canvas).toHaveClass('scale-x-100');
    expect(context.clearRect).toHaveBeenCalledWith(0, 0, 320, 240);
    expect(context.lineTo).not.toHaveBeenCalled();
    expect(context.arc).not.toHaveBeenCalled();
  });
  it('draws with contain logic when fitMode is contain', () => {
    const store = createStore();
    store.set(cameraFitModeAtom, 'contain');
    const targetPose = Array.from({ length: 33 }, (_, index) => ({
      x: (index + 1) / 40,
      y: (index + 1) / 50,
      z: 0,
      visibility: 1,
    }));

    store.set(targetPoseAtom, targetPose);

    // Mock parent to contain a video element
    const container = document.createElement('div');
    const video = document.createElement('video');
    video.setAttribute('data-testid', 'camera-video');
    Object.defineProperty(video, 'videoWidth', { value: 640 });
    Object.defineProperty(video, 'videoHeight', { value: 480 });
    container.appendChild(video);
    
    // We need to render into this container for the querySelector helper to work
    render(
      <Provider store={store}>
          <WireframeCanvas />
      </Provider>,
      { container: document.body.appendChild(container) }
    );

    expect(context.lineTo).toHaveBeenCalled();
  });

  it('uses a translucent white fill and contour for the target pose', () => {
    const store = createStore();
    const fillColors: unknown[] = [];
    const outlineColors: unknown[] = [];
    context.fill = jest.fn(() => fillColors.push(context.fillStyle));
    context.stroke = jest.fn(() => outlineColors.push(context.strokeStyle));
    const targetPose = Array.from({ length: 33 }, (_, index) => ({
      x: (index + 1) / 40,
      y: (index + 1) / 50,
      z: 0,
      visibility: 1,
    }));
    store.set(targetPoseAtom, targetPose);
    store.set(poseResultAtom, null);

    render(
      <Provider store={store}>
        <div className="relative h-[240px] w-[320px]">
          <WireframeCanvas />
        </div>
      </Provider>
    );

    expect(context.clearRect).toHaveBeenCalledWith(0, 0, 320, 240);
    expect(outlineColors).toContain('rgba(255, 255, 255, 0.92)');
    expect(fillColors).toContain('rgba(255, 255, 255, 0.22)');
    expect(context.arc).not.toHaveBeenCalled();
  });

  it('does not draw a silhouette when targetPoseAtom is null', () => {
    const store = createStore();
    store.set(targetPoseAtom, null);
    store.set(poseResultAtom, null);

    render(
      <Provider store={store}>
        <div className="relative h-[240px] w-[320px]">
          <WireframeCanvas />
        </div>
      </Provider>
    );

    expect(context.clearRect).toHaveBeenCalledWith(0, 0, 320, 240);
    expect(context.lineTo).not.toHaveBeenCalled();
    expect(context.arc).not.toHaveBeenCalled();
  });

  it('does not draw the detected joint stick figure when no target pose is selected', () => {
    const store = createStore();
    const landmarks = Array.from({ length: 33 }, (_, index) => ({
      x: (index + 1) / 40,
      y: (index + 1) / 50,
      z: 0,
      visibility: 1,
    }));
    store.set(targetPoseAtom, null);
    store.set(poseResultAtom, {
      landmarks: [landmarks],
      worldLandmarks: [[]],
    } as never);

    render(
      <Provider store={store}>
        <div className="relative h-[240px] w-[320px]">
          <WireframeCanvas />
        </div>
      </Provider>
    );

    expect(context.ellipse).not.toHaveBeenCalled();
    expect(context.lineTo).not.toHaveBeenCalled();
    expect(context.arc).not.toHaveBeenCalled();
    expect(context.fill).not.toHaveBeenCalled();
  });
});
