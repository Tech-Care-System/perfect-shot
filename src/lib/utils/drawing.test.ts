import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { drawConnectors, drawLandmarks, drawPoseSilhouette } from './drawing';

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

function createPose(): NormalizedLandmark[] {
  const pose = Array.from({ length: 33 }, () => createLandmark(0.5, 0.5));
  const points: Record<number, [number, number]> = {
    0: [0.5, 0.1],
    7: [0.43, 0.13],
    8: [0.57, 0.13],
    11: [0.3, 0.28],
    12: [0.7, 0.28],
    13: [0.2, 0.36],
    14: [0.8, 0.36],
    15: [0.25, 0.5],
    16: [0.75, 0.5],
    17: [0.23, 0.52],
    18: [0.77, 0.52],
    19: [0.24, 0.49],
    20: [0.76, 0.49],
    23: [0.42, 0.58],
    24: [0.58, 0.58],
    25: [0.4, 0.75],
    26: [0.6, 0.75],
    27: [0.38, 0.92],
    28: [0.62, 0.92],
    31: [0.36, 0.95],
    32: [0.64, 0.95],
  };

  for (const [index, [x, y]] of Object.entries(points)) {
    pose[Number(index)] = createLandmark(x, y);
  }

  return pose;
}

function createProfilePose(): NormalizedLandmark[] {
  const pose = Array.from({ length: 33 }, () => createLandmark(0.5, 0.5));
  const points: Record<number, [number, number]> = {
    0: [0.5, 0.1],
    7: [0.49, 0.13],
    8: [0.51, 0.13],
    11: [0.495, 0.3],
    12: [0.505, 0.3],
    13: [0.48, 0.42],
    14: [0.52, 0.42],
    15: [0.48, 0.52],
    16: [0.52, 0.52],
    17: [0.47, 0.53],
    18: [0.53, 0.53],
    19: [0.49, 0.53],
    20: [0.51, 0.53],
    23: [0.495, 0.58],
    24: [0.505, 0.58],
    25: [0.49, 0.75],
    26: [0.51, 0.75],
    27: [0.49, 0.92],
    28: [0.51, 0.92],
    31: [0.48, 0.95],
    32: [0.52, 0.95],
  };

  for (const [index, [x, y]] of Object.entries(points)) {
    pose[Number(index)] = createLandmark(x, y);
  }

  return pose;
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

  it('draws a translucent anatomical silhouette with a mapped head and rounded limbs', () => {
    const ctx = createMockContext(100, 200);
    const fillColor = 'rgba(255, 255, 255, 0.14)';
    const outlineColor = 'rgba(255, 255, 255, 0.92)';

    drawPoseSilhouette(ctx, createPose(), { fillColor, outlineColor });

    const head = (ctx.ellipse as jest.Mock).mock.calls[0];
    expect(head[0]).toBeCloseTo(50, 5);
    expect(head[1]).toBeCloseTo(41.895, 3);
    expect(head[2]).toBeCloseTo(7, 5);
    expect(head[3]).toBeCloseTo(9.1, 5);
    expect(head.slice(4)).toEqual([0, 0, Math.PI * 2]);
    expect(ctx.fill).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
    expect(ctx.closePath).toHaveBeenCalled();
    expect(ctx.fillStyle).toBe(fillColor);
    expect(ctx.strokeStyle).toBe(outlineColor);
    expect(ctx.arc).not.toHaveBeenCalled();
  });

  it('projects the silhouette through the same cover crop as the live video', () => {
    const ctx = createMockContext(320, 240);
    const style = {
      objectFit: 'cover' as const,
      sourceWidth: 1280,
      sourceHeight: 720,
    };

    drawPoseSilhouette(ctx, createPose(), style);

    const head = (ctx.ellipse as jest.Mock).mock.calls[0];
    expect(head[0]).toBeCloseTo(160, 2);
    expect(head[1]).toBeCloseTo(31.2, 2);
  });

  it('keeps profile torso volume when shoulder and hip landmarks nearly overlap', () => {
    const ctx = createMockContext(100, 200);

    drawPoseSilhouette(ctx, createProfilePose());

    const torsoStart = (ctx.moveTo as jest.Mock).mock.calls[6] as [number, number];
    const torsoCurves = (ctx.bezierCurveTo as jest.Mock).mock.calls as number[][];
    const shoulderEnd = torsoCurves[4]!.slice(-2);
    const hipStart = torsoCurves[1]!.slice(-2);
    const hipEnd = torsoCurves[2]!.slice(-2);

    expect(Math.hypot(shoulderEnd[0]! - torsoStart[0], shoulderEnd[1]! - torsoStart[1])).toBeGreaterThan(30);
    expect(Math.hypot(hipEnd[0]! - hipStart[0]!, hipEnd[1]! - hipStart[1]!)).toBeGreaterThan(20);
  });

  it('caps the head-to-shoulder gap to a proportion of torso and head length', () => {
    const ctx = createMockContext(100, 200);
    const pose = createPose();

    drawPoseSilhouette(ctx, pose);

    const [, headY, , headRadiusY] = (ctx.ellipse as jest.Mock).mock.calls[0] as number[];
    const shoulderCenterY = ((pose[11]!.y + pose[12]!.y) / 2) * 200;
    const hipCenterY = ((pose[23]!.y + pose[24]!.y) / 2) * 200;
    const torsoLength = hipCenterY - shoulderCenterY;
    const neckStartY = headY! + headRadiusY! * 0.65;
    const maxNeckLength = Math.min(torsoLength * 0.24, headRadiusY! * 0.9);

    expect(shoulderCenterY - neckStartY).toBeLessThanOrEqual(maxNeckLength + 0.01);
  });

  it('keeps limb contours open instead of outlining each joint cap', () => {
    const ctx = createMockContext();
    let pathIsClosed = false;
    const closedContourStrokes = jest.fn();
    ctx.beginPath = jest.fn(() => {
      pathIsClosed = false;
    });
    ctx.closePath = jest.fn(() => {
      pathIsClosed = true;
    });
    ctx.stroke = jest.fn(() => {
      if (pathIsClosed) closedContourStrokes();
    });

    drawPoseSilhouette(ctx, createPose());

    // Only the torso is a closed contour; head and limb side-lines are open paths.
    expect(closedContourStrokes).toHaveBeenCalledTimes(1);
  });

  it('skips incomplete core landmarks and ignores invalid limb points', () => {
    const ctx = createMockContext();
    const incompletePose = createPose();
    incompletePose[23] = createLandmark(Number.NaN, 0.58);

    expect(() => drawPoseSilhouette(ctx, incompletePose)).not.toThrow();
    expect(ctx.ellipse).not.toHaveBeenCalled();
    expect(ctx.fill).not.toHaveBeenCalled();

    const partialPose = createPose();
    partialPose[13] = createLandmark(Number.NaN, 0.36);
    drawPoseSilhouette(ctx, partialPose);

    for (const mock of [ctx.ellipse, ctx.moveTo, ctx.lineTo, ctx.quadraticCurveTo]) {
      for (const call of (mock as jest.Mock).mock.calls) {
        expect(call.every((value: unknown) => typeof value !== 'number' || Number.isFinite(value))).toBe(true);
      }
    }
  });
});
