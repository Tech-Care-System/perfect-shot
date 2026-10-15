describe('audio-feedback', () => {
  let mockPlay: jest.Mock;
  let mockLoad: jest.Mock;
  let mockAudio: { preload: string; load: jest.Mock; play: jest.Mock; currentTime: number };

  beforeEach(() => {
    mockPlay = jest.fn().mockResolvedValue(undefined);
    mockLoad = jest.fn();
    mockAudio = { preload: '', load: mockLoad, play: mockPlay, currentTime: 0 };
    global.Audio = jest.fn().mockImplementation(() => mockAudio) as unknown as typeof Audio;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  it('preloadAudio creates Audio with correct src and calls load', async () => {
    const { preloadAudio } = await import('./audio-feedback');
    preloadAudio();

    expect(global.Audio).toHaveBeenCalledWith('/sounds/ding.mp3');
    expect(mockAudio.preload).toBe('auto');
    expect(mockLoad).toHaveBeenCalled();
  });

  it('preloadAudio called twice only creates one Audio element', async () => {
    const { preloadAudio } = await import('./audio-feedback');
    preloadAudio();
    preloadAudio();

    expect(global.Audio).toHaveBeenCalledTimes(1);
  });

  it('playDing before preloadAudio is a no-op', async () => {
    const { playDing } = await import('./audio-feedback');
    playDing();

    expect(mockPlay).not.toHaveBeenCalled();
  });

  it('playDing after preloadAudio resets currentTime and calls play', async () => {
    const { preloadAudio, playDing } = await import('./audio-feedback');
    preloadAudio();
    mockAudio.currentTime = 0.5;
    playDing();

    expect(mockAudio.currentTime).toBe(0);
    expect(mockPlay).toHaveBeenCalled();
  });

  it('playDing handles play() promise rejection gracefully', async () => {
    mockPlay.mockRejectedValue(new Error('autoplay blocked'));
    const { preloadAudio, playDing } = await import('./audio-feedback');
    preloadAudio();
    playDing();

    await Promise.resolve();
    expect(mockPlay).toHaveBeenCalled();
  });

  it('preloadAudio does not throw when Audio constructor throws', async () => {
    global.Audio = jest.fn().mockImplementation(() => {
      throw new Error('Audio not supported');
    }) as unknown as typeof Audio;
    const { preloadAudio } = await import('./audio-feedback');

    expect(() => preloadAudio()).not.toThrow();
  });
});
