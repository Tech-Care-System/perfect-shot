import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { drawConnectors, drawLandmarks } from './drawing';

function createLandmark(x: number, y: number): NormalizedLandmark {
  return {
    x,
    y,
    z: 0,
    visibility: 1,
  };
}

function createMockContext(width = 100, height = 200) {
  return {
    canvas: { width, height },
    save: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    closePath: jest.fn(),
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

describe('drawing utilities', () => {
  it('drawLandmarks scales normalized coordinates into canvas pixels', () => {
    const ctx = createMockContext(100, 200);
    const landmarks = [createLandmark(0.25, 0.5), createLandmark(0.8, 0.1)];

    drawLandmarks(ctx, landmarks, { radius: 4, color: '#00FFFF' });

    expect(ctx.arc).toHaveBeenCalledWith(25, 100, 4, 0, Math.PI * 2);
    expect(ctx.arc).toHaveBeenCalledWith(80, 20, 4, 0, Math.PI * 2);
    expect(ctx.fill).toHaveBeenCalledTimes(2);
  });

  it('drawConnectors scales and draws only valid connection pairs', () => {
    const ctx = createMockContext(200, 100);
    const landmarks = [createLandmark(0.1, 0.2), createLandmark(0.9, 0.8)] as NormalizedLandmark[];
    const connections: [number, number][] = [
      [0, 1],
      [1, 999],
    ];

    drawConnectors(ctx, landmarks, connections, { lineWidth: 3, color: '#FFFFFF' });

    expect(ctx.moveTo).toHaveBeenCalledWith(20, 20);
    expect(ctx.lineTo).toHaveBeenCalledWith(180, 80);
    expect(ctx.stroke).toHaveBeenCalledTimes(1);
    expect(ctx.lineTo).toHaveBeenCalledTimes(1);
  });

  it('maps normalized points using object-cover crop math when source aspect differs', () => {
    const ctx = createMockContext(320, 240); // 4:3 canvas
    const landmarks = [createLandmark(0, 0.5), createLandmark(1, 0.5)];
    const connections: [number, number][] = [[0, 1]];

    drawConnectors(ctx, landmarks, connections, {
      objectFit: 'cover',
      sourceWidth: 1280, // 16:9 source
      sourceHeight: 720,
    });

    const moveToCall = (ctx.moveTo as jest.Mock).mock.calls[0];
    const lineToCall = (ctx.lineTo as jest.Mock).mock.calls[0];

    expect(moveToCall[0]).toBeCloseTo(-53.333, 2); // left-cropped overflow
    expect(moveToCall[1]).toBeCloseTo(120, 2);
    expect(lineToCall[0]).toBeCloseTo(373.333, 2); // right-cropped overflow
    expect(lineToCall[1]).toBeCloseTo(120, 2);
  });
});
