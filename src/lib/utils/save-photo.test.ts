import { savePhoto } from './save-photo';

const TEST_DATA_URL = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';

describe('savePhoto', () => {
  let mockCreateObjectURL: jest.Mock;
  let mockRevokeObjectURL: jest.Mock;
  let appendSpy: jest.SpyInstance;
  let removeSpy: jest.SpyInstance;
  let mockAnchor: { href: string; download: string; click: jest.Mock };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-02-21T14:30:52'));

    mockCreateObjectURL = jest.fn().mockReturnValue('blob:mock-url');
    mockRevokeObjectURL = jest.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    mockAnchor = { href: '', download: '', click: jest.fn() };
    jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') return mockAnchor as unknown as HTMLAnchorElement;
      return document.createElement(tag);
    });

    appendSpy = jest.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    removeSpy = jest.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('creates a Blob from data URL with correct MIME type', () => {
    savePhoto(TEST_DATA_URL);

    expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
    const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/jpeg');
  });

  it('creates an anchor with download attribute matching filename pattern', () => {
    savePhoto(TEST_DATA_URL);

    expect(mockAnchor.download).toBe('ai-perfect-shot-2026-02-21-143052.jpg');
    expect(mockAnchor.href).toBe('blob:mock-url');
  });

  it('clicks the anchor to trigger download', () => {
    savePhoto(TEST_DATA_URL);

    expect(mockAnchor.click).toHaveBeenCalledTimes(1);
  });

  it('appends and removes the anchor from document.body', () => {
    savePhoto(TEST_DATA_URL);

    expect(appendSpy).toHaveBeenCalledWith(mockAnchor);
    expect(removeSpy).toHaveBeenCalledWith(mockAnchor);
  });

  it('revokes the object URL after a timeout', () => {
    savePhoto(TEST_DATA_URL);

    expect(mockRevokeObjectURL).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);

    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('does not throw when data URL is malformed', () => {
    expect(() => savePhoto('not-a-data-url')).not.toThrow();
  });

  it('generates filename with correct timestamp format', () => {
    jest.setSystemTime(new Date('2026-01-05T09:03:07'));

    savePhoto(TEST_DATA_URL);

    expect(mockAnchor.download).toBe('ai-perfect-shot-2026-01-05-090307.jpg');
  });
});
