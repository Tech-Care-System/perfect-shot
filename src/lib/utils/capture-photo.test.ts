import { capturePhoto } from './capture-photo';

const mockCtx = {
  drawImage: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
};

const mockCanvas = {
  width: 0,
  height: 0,
  getContext: jest.fn().mockReturnValue(mockCtx),
  toDataURL: jest.fn().mockReturnValue('data:image/jpeg;base64,mock'),
};

const originalCreateElement = document.createElement.bind(document);

beforeEach(() => {
  jest.clearAllMocks();
  mockCanvas.width = 0;
  mockCanvas.height = 0;
  mockCanvas.getContext.mockReturnValue(mockCtx);
  jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
    return originalCreateElement(tag);
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

function makeVideo(width: number, height: number): HTMLVideoElement {
  return { videoWidth: width, videoHeight: height } as HTMLVideoElement;
}

describe('capturePhoto', () => {
  it('captures a non-mirrored photo with correct canvas dimensions', () => {
    const video = makeVideo(1920, 1080);
    const result = capturePhoto(video, false);

    expect(mockCanvas.width).toBe(1920);
    expect(mockCanvas.height).toBe(1080);
    expect(mockCtx.translate).not.toHaveBeenCalled();
    expect(mockCtx.scale).not.toHaveBeenCalled();
    expect(mockCtx.drawImage).toHaveBeenCalledWith(video, 0, 0);
    expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/jpeg', 0.92);
    expect(result).toBe('data:image/jpeg;base64,mock');
  });

  it('applies horizontal flip when isMirrored is true', () => {
    const video = makeVideo(1280, 720);
    const result = capturePhoto(video, true);

    expect(mockCtx.translate).toHaveBeenCalledWith(1280, 0);
    expect(mockCtx.scale).toHaveBeenCalledWith(-1, 1);
    const translateOrder = mockCtx.translate.mock.invocationCallOrder[0];
    const scaleOrder = mockCtx.scale.mock.invocationCallOrder[0];
    const drawOrder = mockCtx.drawImage.mock.invocationCallOrder[0];
    expect(translateOrder).toBeLessThan(drawOrder);
    expect(scaleOrder).toBeLessThan(drawOrder);
    expect(result).toBe('data:image/jpeg;base64,mock');
  });

  it('returns empty string when getContext returns null', () => {
    mockCanvas.getContext.mockReturnValue(null);
    const video = makeVideo(640, 480);
    const result = capturePhoto(video, false);

    expect(result).toBe('');
    expect(mockCtx.drawImage).not.toHaveBeenCalled();
  });

  it('sets canvas dimensions to match video dimensions', () => {
    const video = makeVideo(3840, 2160);
    capturePhoto(video, false);

    expect(mockCanvas.width).toBe(3840);
    expect(mockCanvas.height).toBe(2160);
  });

  it('handles zero-dimension video by returning empty data URL', () => {
    const video = makeVideo(0, 0);
    const result = capturePhoto(video, false);

    expect(mockCanvas.width).toBe(0);
    expect(mockCanvas.height).toBe(0);
    expect(result).toBe('');
  });
});
