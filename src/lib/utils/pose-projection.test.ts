import { ALL_POSES } from '@/data/poses';
import { calculatePoseSimilarity } from './calculate-similarity';
import { generateCorrection } from './generate-correction';
import { normalizeCameraPose, projectReferencePose } from './pose-projection';

const target = ALL_POSES[0].targetLandmarks;
const frame = { x: 220, y: 76, width: 160, height: 400 };

describe('reference pose projection', () => {
  it.each(ALL_POSES.map((pose) => [pose.name, pose.targetLandmarks] as const))(
    'fits every landmark of %s inside the usable frame', (_name, landmarks) => {
      const projected = projectReferencePose(landmarks, 393, 735, frame, false);
      for (const point of projected) {
        expect(point.x * 393).toBeGreaterThanOrEqual(frame.x);
        expect(point.x * 393).toBeLessThanOrEqual(frame.x + frame.width);
        expect(point.y * 735).toBeGreaterThanOrEqual(frame.y);
        expect(point.y * 735).toBeLessThanOrEqual(frame.y + frame.height);
      }
    },
  );

  it('mirrors a front-camera guide within its own frame, preserving its position', () => {
    const rear = projectReferencePose(target, 393, 735, frame, false);
    const front = projectReferencePose(target, 393, 735, frame, true);
    for (let index = 0; index < target.length; index++) {
      expect((rear[index].x + front[index].x) * 393).toBeCloseTo(2 * frame.x + frame.width);
      expect(front[index].y).toBe(rear[index].y);
    }
    expect(front[11].x).toBeGreaterThan(front[12].x);
  });

  it.each([0, -1, NaN, Infinity])('skips an unusable frame height of %s', (height) => {
    expect(projectReferencePose(target, 393, 735, { ...frame, height }, false)).toEqual([]);
  });

  it.each([[1920, 1080], [640, 480], [1080, 1920]])(
    'preserves matching and correction semantics for a %ix%i camera', (width, height) => {
      const factor = (9 / 16) / (width / height);
      const detected = target.map((point) => ({
        ...point, x: 0.6 + (point.x - 0.5) * factor * 0.7,
        y: point.y * 0.7 + 0.12, z: point.z * factor * 0.7,
      }));
      const original = detected.map((point) => ({ ...point }));
      const normalized = normalizeCameraPose(detected, width, height);
      expect(calculatePoseSimilarity(normalized, target)).toBeCloseTo(1, 6);
      expect(generateCorrection(normalized, target)).toBeNull();
      const different = normalized.map((point, index) => index === 15 ? { ...point, y: point.y - 0.4 } : point);
      expect(calculatePoseSimilarity(different, target)).toBeLessThan(0.99);
      expect(generateCorrection(different, target)).not.toBeNull();
      expect(detected).toEqual(original);
    },
  );

  it.each([[0, 1080], [1920, 0], [NaN, 1080], [1920, Infinity]])(
    'keeps raw landmarks when frame dimensions %s x %s are unavailable', (width, height) => {
      expect(normalizeCameraPose(target, width, height)).toBe(target);
    },
  );
});
