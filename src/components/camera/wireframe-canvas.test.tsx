import { cameraFacingModeAtom, cameraFitModeAtom } from '@/lib/stores/camera-store';
import { poseResultAtom, targetPoseAtom } from '@/lib/stores/pose-store';
import { render, screen } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { WireframeCanvas } from './wireframe-canvas';

function createContextMock() {
  return {
    canvas: { width: 0, height: 0 },
    save: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    clearRect: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 0,
    shadowColor: '',
    shadowBlur: 0,
  } as unknown as CanvasRenderingContext2D;
}

describe('WireframeCanvas Component', () => {
  const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  let context: CanvasRenderingContext2D;

  beforeEach(() => {
    context = createContextMock();

    jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
      width: 320,
      height: 240,
      top: 0,
      left: 0,
      right: 320,
      bottom: 240,
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

  it('clears and draws wireframe when pose landmarks are available', () => {
    const store = createStore();
    store.set(cameraFacingModeAtom, 'user');
    const landmarks = Array.from({ length: 33 }, (_, index) => ({
      x: (index + 1) / 40,
      y: (index + 1) / 50,
      z: 0,
      visibility: 1,
    }));

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

    const canvas = screen.getByTestId('wireframe-canvas');
    expect(canvas).toHaveClass('scale-x-[-1]');
    expect(context.clearRect).toHaveBeenCalledWith(0, 0, 320, 240);
    expect(context.lineTo).toHaveBeenCalled();
    expect(context.arc).toHaveBeenCalled();
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
    const landmarks = Array.from({ length: 33 }, (_, index) => ({
      x: (index + 1) / 40,
      y: (index + 1) / 50,
      z: 0,
      visibility: 1,
    }));

    store.set(poseResultAtom, {
      landmarks: [landmarks],
      worldLandmarks: [[]],
    } as never);

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

  it('draws target wireframe with correct style when targetPoseAtom has data', () => {
    const store = createStore();
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
    expect(context.lineTo).toHaveBeenCalled();
    expect(context.arc).toHaveBeenCalled();
    expect(context.strokeStyle).toBe('rgba(255, 255, 255, 0.35)');
    expect(context.fillStyle).toBe('rgba(255, 255, 255, 0.35)');
    expect(context.lineWidth).toBe(1);
  });

  it('does not draw target wireframe when targetPoseAtom is null', () => {
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

  it('draws target wireframe BEFORE user wireframe when both are present', () => {
    const store = createStore();
    const styleLog: string[] = [];
    Object.defineProperty(context, 'strokeStyle', {
      set(v: string) { styleLog.push(v); },
      get() { return styleLog[styleLog.length - 1] ?? ''; },
      configurable: true,
    });

    const landmarks = Array.from({ length: 33 }, (_, index) => ({
      x: (index + 1) / 40,
      y: (index + 1) / 50,
      z: 0,
      visibility: 1,
    }));
    const targetPose = Array.from({ length: 33 }, (_, index) => ({
      x: (index + 2) / 40,
      y: (index + 2) / 50,
      z: 0,
      visibility: 1,
    }));

    store.set(targetPoseAtom, targetPose);
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

    expect(context.save).toHaveBeenCalledTimes(4);
    expect(context.restore).toHaveBeenCalledTimes(4);

    const targetIdx = styleLog.indexOf('rgba(255, 255, 255, 0.35)');
    const userIdx = styleLog.indexOf('#00FFFF');
    expect(targetIdx).toBeGreaterThanOrEqual(0);
    expect(userIdx).toBeGreaterThanOrEqual(0);
    expect(targetIdx).toBeLessThan(userIdx);
  });
});
