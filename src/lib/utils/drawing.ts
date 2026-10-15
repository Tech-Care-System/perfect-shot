import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { PoseConnection } from './pose-connections';

export interface DrawingStyle {
  color?: string;
  lineWidth?: number;
  radius?: number;
  shadowColor?: string;
  shadowBlur?: number;
  sourceWidth?: number;
  sourceHeight?: number;
  objectFit?: 'fill' | 'cover' | 'contain';
}

export interface PoseSilhouetteStyle extends DrawingStyle {
  fillColor?: string;
  outlineColor?: string;
}


const DEFAULT_COLOR = '#00FFFF';
const DEFAULT_LINE_WIDTH = 2;
const DEFAULT_RADIUS = 3;

function hasFiniteCoordinates(landmark: NormalizedLandmark | undefined): landmark is NormalizedLandmark {
  return Boolean(landmark && Number.isFinite(landmark.x) && Number.isFinite(landmark.y));
}

function applyStyle(ctx: CanvasRenderingContext2D, style: DrawingStyle) {
  const color = style.color ?? DEFAULT_COLOR;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = style.lineWidth ?? DEFAULT_LINE_WIDTH;
  ctx.shadowColor = style.shadowColor ?? 'transparent';
  ctx.shadowBlur = style.shadowBlur ?? 0;
}

function toCanvasPoint(
  ctx: CanvasRenderingContext2D,
  landmark: NormalizedLandmark,
  style: DrawingStyle
) {
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;

  if (
    typeof style.sourceWidth === 'number' &&
    typeof style.sourceHeight === 'number' &&
    style.sourceWidth > 0 &&
    style.sourceHeight > 0
  ) {
    if (style.objectFit === 'cover') {
      const scale = Math.max(canvasWidth / style.sourceWidth, canvasHeight / style.sourceHeight);
      const renderedWidth = style.sourceWidth * scale;
      const renderedHeight = style.sourceHeight * scale;
      const cropOffsetX = (renderedWidth - canvasWidth) / 2;
      const cropOffsetY = (renderedHeight - canvasHeight) / 2;

      return {
        x: landmark.x * renderedWidth - cropOffsetX,
        y: landmark.y * renderedHeight - cropOffsetY,
      };
    }

    if (style.objectFit === 'contain') {
      const scale = Math.min(canvasWidth / style.sourceWidth, canvasHeight / style.sourceHeight);
      const renderedWidth = style.sourceWidth * scale;
      const renderedHeight = style.sourceHeight * scale;
      const offsetX = (canvasWidth - renderedWidth) / 2;
      const offsetY = (canvasHeight - renderedHeight) / 2;

      return {
        x: landmark.x * renderedWidth + offsetX,
        y: landmark.y * renderedHeight + offsetY,
      };
    }
  }

  // Default: stretched to fill canvas
  return {
    x: landmark.x * canvasWidth,
    y: landmark.y * canvasHeight,
  };
}


export function drawLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  style: DrawingStyle = {}
) {
  if (landmarks.length === 0) return;

  const radius = style.radius ?? DEFAULT_RADIUS;

  ctx.save();
  applyStyle(ctx, style);

  for (const landmark of landmarks) {
    if (!hasFiniteCoordinates(landmark)) continue;

    const { x: pixelX, y: pixelY } = toCanvasPoint(ctx, landmark, style);
    ctx.beginPath();
    ctx.arc(pixelX, pixelY, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawConnectors(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  connections: PoseConnection[],
  style: DrawingStyle = {}
) {
  if (landmarks.length === 0 || connections.length === 0) return;

  ctx.save();
  applyStyle(ctx, style);
  ctx.beginPath();

  for (const [startIndex, endIndex] of connections) {
    const from = landmarks[startIndex];
    const to = landmarks[endIndex];
    if (!hasFiniteCoordinates(from) || !hasFiniteCoordinates(to)) continue;

    const { x: fromX, y: fromY } = toCanvasPoint(ctx, from, style);
    const { x: toX, y: toY } = toCanvasPoint(ctx, to, style);

    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
  }

  ctx.stroke();
  ctx.restore();
}

const DEFAULT_SILHOUETTE_FILL = 'rgba(255, 255, 255, 0.22)';
const DEFAULT_SILHOUETTE_OUTLINE = 'rgba(255, 255, 255, 0.92)';
const MIN_SILHOUETTE_VISIBILITY = 0.15;

interface Point {
  x: number;
  y: number;
}

function distanceBetween(a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function midpoint(a: Point, b: Point): Point {
  return { x: a.x / 2 + b.x / 2, y: a.y / 2 + b.y / 2 };
}

function pointAt(center: Point, axisX: number, axisY: number, along: number, normalX: number, normalY: number, across: number): Point {
  return {
    x: center.x + axisX * along + normalX * across,
    y: center.y + axisY * along + normalY * across,
  };
}

function cubicTo(ctx: CanvasRenderingContext2D, controlA: Point, controlB: Point, end: Point) {
  ctx.bezierCurveTo(controlA.x, controlA.y, controlB.x, controlB.y, end.x, end.y);
}

function drawSilhouetteContour(
  ctx: CanvasRenderingContext2D,
  style: PoseSilhouetteStyle,
  createPath: () => void,
  lineCap: CanvasLineCap = 'round'
) {
  ctx.save();
  ctx.beginPath();
  createPath();
  ctx.strokeStyle = style.outlineColor ?? DEFAULT_SILHOUETTE_OUTLINE;
  ctx.lineWidth = style.lineWidth ?? 1.5;
  ctx.lineCap = lineCap;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();
}

interface LimbContour {
  from: Point;
  to: Point;
  normalX: number;
  normalY: number;
}

function appendLimbPath(
  ctx: CanvasRenderingContext2D,
  from: Point | null,
  to: Point | null,
  width: number
): LimbContour | null {
  if (!from || !to || !Number.isFinite(width) || width <= 0) return null;

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (!Number.isFinite(length) || length < 1) return null;

  const radius = width / 2;
  const directionX = dx / length;
  const directionY = dy / length;
  const normalX = -directionY * radius;
  const normalY = directionX * radius;

  // Add the rounded capsule to the shared fill path; contours are drawn without end caps later.
  ctx.moveTo(from.x + normalX, from.y + normalY);
  ctx.lineTo(to.x + normalX, to.y + normalY);
  ctx.quadraticCurveTo(
    to.x + directionX * radius * 2,
    to.y + directionY * radius * 2,
    to.x - normalX,
    to.y - normalY
  );
  ctx.lineTo(from.x - normalX, from.y - normalY);
  ctx.quadraticCurveTo(
    from.x - directionX * radius * 2,
    from.y - directionY * radius * 2,
    from.x + normalX,
    from.y + normalY
  );
  ctx.closePath();

  return { from, to, normalX, normalY };
}

function appendTorsoPath(
  ctx: CanvasRenderingContext2D,
  shoulderCenter: Point,
  hipCenter: Point,
  axisX: number,
  axisY: number,
  normalX: number,
  normalY: number,
  torsoLength: number,
  shoulderWidth: number,
  hipWidth: number
) {
  const waistWidth = Math.min(Math.min(shoulderWidth, hipWidth) * 0.84, torsoLength * 0.35);
  const shoulderA = pointAt(shoulderCenter, axisX, axisY, 0, normalX, normalY, -shoulderWidth / 2);
  const shoulderB = pointAt(shoulderCenter, axisX, axisY, 0, normalX, normalY, shoulderWidth / 2);
  const waistA = pointAt(shoulderCenter, axisX, axisY, torsoLength * 0.52, normalX, normalY, -waistWidth / 2);
  const waistB = pointAt(shoulderCenter, axisX, axisY, torsoLength * 0.52, normalX, normalY, waistWidth / 2);
  const hipA = pointAt(hipCenter, axisX, axisY, 0, normalX, normalY, -hipWidth / 2);
  const hipB = pointAt(hipCenter, axisX, axisY, 0, normalX, normalY, hipWidth / 2);

  ctx.moveTo(shoulderA.x, shoulderA.y);
  cubicTo(
    ctx,
    pointAt(shoulderCenter, axisX, axisY, torsoLength * 0.2, normalX, normalY, -shoulderWidth * 0.48),
    pointAt(shoulderCenter, axisX, axisY, torsoLength * 0.4, normalX, normalY, -waistWidth * 0.54),
    waistA
  );
  cubicTo(
    ctx,
    pointAt(shoulderCenter, axisX, axisY, torsoLength * 0.68, normalX, normalY, -waistWidth * 0.54),
    pointAt(hipCenter, axisX, axisY, -torsoLength * 0.12, normalX, normalY, -hipWidth * 0.55),
    hipA
  );
  cubicTo(
    ctx,
    pointAt(hipCenter, axisX, axisY, torsoLength * 0.12, normalX, normalY, -hipWidth * 0.4),
    pointAt(hipCenter, axisX, axisY, torsoLength * 0.12, normalX, normalY, hipWidth * 0.4),
    hipB
  );
  cubicTo(
    ctx,
    pointAt(hipCenter, axisX, axisY, -torsoLength * 0.12, normalX, normalY, hipWidth * 0.55),
    pointAt(shoulderCenter, axisX, axisY, torsoLength * 0.68, normalX, normalY, waistWidth * 0.54),
    waistB
  );
  cubicTo(
    ctx,
    pointAt(shoulderCenter, axisX, axisY, torsoLength * 0.4, normalX, normalY, waistWidth * 0.54),
    pointAt(shoulderCenter, axisX, axisY, torsoLength * 0.2, normalX, normalY, shoulderWidth * 0.48),
    shoulderB
  );
  cubicTo(
    ctx,
    pointAt(shoulderCenter, axisX, axisY, -torsoLength * 0.08, normalX, normalY, shoulderWidth * 0.24),
    pointAt(shoulderCenter, axisX, axisY, -torsoLength * 0.08, normalX, normalY, -shoulderWidth * 0.24),
    shoulderA
  );
  ctx.closePath();
}

function drawLimbContours(ctx: CanvasRenderingContext2D, limbs: LimbContour[], style: PoseSilhouetteStyle) {
  if (limbs.length === 0) return;

  ctx.save();
  ctx.beginPath();
  for (const { from, to, normalX, normalY } of limbs) {
    ctx.moveTo(from.x + normalX, from.y + normalY);
    ctx.lineTo(to.x + normalX, to.y + normalY);
    ctx.moveTo(from.x - normalX, from.y - normalY);
    ctx.lineTo(to.x - normalX, to.y - normalY);
  }
  ctx.strokeStyle = style.outlineColor ?? DEFAULT_SILHOUETTE_OUTLINE;
  ctx.lineWidth = style.lineWidth ?? 1.5;
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();
}

/** Draw a translucent human contour from MediaPipe's 33 normalized pose points. */
export function drawPoseSilhouette(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  style: PoseSilhouetteStyle = {}
) {
  if (landmarks.length < 33) return;

  const getPoint = (index: number): Point | null => {
    const landmark = landmarks[index];
    if (
      !hasFiniteCoordinates(landmark) ||
      (typeof landmark.visibility === 'number' && landmark.visibility < MIN_SILHOUETTE_VISIBILITY)
    ) {
      return null;
    }

    const point = toCanvasPoint(ctx, landmark, style);
    return Number.isFinite(point.x) && Number.isFinite(point.y) ? point : null;
  };

  const leftShoulder = getPoint(11);
  const rightShoulder = getPoint(12);
  const leftHip = getPoint(23);
  const rightHip = getPoint(24);
  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return;

  const shoulderCenter = midpoint(leftShoulder, rightShoulder);
  const hipCenter = midpoint(leftHip, rightHip);
  const torsoDeltaX = hipCenter.x - shoulderCenter.x;
  const torsoDeltaY = hipCenter.y - shoulderCenter.y;
  const torsoLength = Math.hypot(torsoDeltaX, torsoDeltaY);
  if (!Number.isFinite(torsoLength) || torsoLength < 1) return;

  const axisX = torsoDeltaX / torsoLength;
  const axisY = torsoDeltaY / torsoLength;
  let normalX = -axisY;
  let normalY = axisX;
  const shoulderSideX = rightShoulder.x - leftShoulder.x;
  const shoulderSideY = rightShoulder.y - leftShoulder.y;
  const hipSideX = rightHip.x - leftHip.x;
  const hipSideY = rightHip.y - leftHip.y;
  const shoulderProjection = shoulderSideX * normalX + shoulderSideY * normalY;
  const hipProjection = hipSideX * normalX + hipSideY * normalY;
  const lateralOrientation = Math.abs(shoulderProjection) >= 1
    ? shoulderProjection
    : hipProjection;
  if (lateralOrientation < 0) {
    normalX = -normalX;
    normalY = -normalY;
  }

  const measuredShoulderWidth = Math.abs(shoulderSideX * normalX + shoulderSideY * normalY);
  const measuredHipWidth = Math.abs(hipSideX * normalX + hipSideY * normalY);
  const shoulderWidth = Math.max(measuredShoulderWidth, torsoLength * 0.58);
  const hipWidth = Math.max(measuredHipWidth, torsoLength * 0.42);

  const leftEar = getPoint(7);
  const rightEar = getPoint(8);
  const nose = getPoint(0);
  let headCenter = leftEar && rightEar
    ? midpoint(leftEar, rightEar)
    : nose
      ? { x: nose.x, y: nose.y - torsoLength * 0.08 }
      : { x: shoulderCenter.x - axisX * torsoLength * 0.24, y: shoulderCenter.y - axisY * torsoLength * 0.24 };
  const earWidth = leftEar && rightEar ? distanceBetween(leftEar, rightEar) : shoulderWidth * 0.28;
  const headRadiusX = Math.max(shoulderWidth * 0.1, earWidth * 0.5, torsoLength * 0.115);
  const headRadiusY = headRadiusX * 1.3;
  let neckStart = {
    x: headCenter.x + axisX * headRadiusY * 0.65,
    y: headCenter.y + axisY * headRadiusY * 0.65,
  };
  const maxNeckLength = Math.min(torsoLength * 0.24, headRadiusY * 0.9);
  const neckDeltaX = shoulderCenter.x - neckStart.x;
  const neckDeltaY = shoulderCenter.y - neckStart.y;
  const neckLength = Math.hypot(neckDeltaX, neckDeltaY);
  if (neckLength > maxNeckLength) {
    const shift = (neckLength - maxNeckLength) / neckLength;
    headCenter = {
      x: headCenter.x + neckDeltaX * shift,
      y: headCenter.y + neckDeltaY * shift,
    };
    neckStart = {
      x: headCenter.x + axisX * headRadiusY * 0.65,
      y: headCenter.y + axisY * headRadiusY * 0.65,
    };
  }

  const limbs: LimbContour[] = [];
  const addLimb = (from: Point | null, to: Point | null, width: number) => {
    const contour = appendLimbPath(ctx, from, to, width);
    if (contour) limbs.push(contour);
  };
  const leftWrist = getPoint(15);
  const rightWrist = getPoint(16);
  const leftHandPoints = [getPoint(17), getPoint(19)].filter((point): point is Point => point !== null);
  const rightHandPoints = [getPoint(18), getPoint(20)].filter((point): point is Point => point !== null);
  const leftHand = leftHandPoints.length === 2 ? midpoint(leftHandPoints[0], leftHandPoints[1]) : leftHandPoints[0] ?? leftWrist;
  const rightHand = rightHandPoints.length === 2 ? midpoint(rightHandPoints[0], rightHandPoints[1]) : rightHandPoints[0] ?? rightWrist;

  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = style.fillColor ?? DEFAULT_SILHOUETTE_FILL;
  const upperLegWidth = Math.max(hipWidth * 0.36, torsoLength * 0.1);
  const lowerLegWidth = Math.max(hipWidth * 0.27, torsoLength * 0.08);
  const footWidth = Math.max(hipWidth * 0.19, torsoLength * 0.06);
  const upperArmWidth = Math.max(shoulderWidth * 0.13, torsoLength * 0.065);
  const lowerArmWidth = Math.max(shoulderWidth * 0.1, torsoLength * 0.055);
  const handWidth = Math.max(shoulderWidth * 0.1, torsoLength * 0.055);
  addLimb(getPoint(23), getPoint(25), upperLegWidth);
  addLimb(getPoint(25), getPoint(27), lowerLegWidth);
  addLimb(getPoint(27), getPoint(31), footWidth);
  addLimb(getPoint(24), getPoint(26), upperLegWidth);
  addLimb(getPoint(26), getPoint(28), lowerLegWidth);
  addLimb(getPoint(28), getPoint(32), footWidth);
  appendTorsoPath(ctx, shoulderCenter, hipCenter, axisX, axisY, normalX, normalY, torsoLength, shoulderWidth, hipWidth);
  addLimb(neckStart, shoulderCenter, Math.max(shoulderWidth * 0.2, torsoLength * 0.075));
  addLimb(getPoint(11), getPoint(13), upperArmWidth);
  addLimb(getPoint(13), leftWrist, lowerArmWidth);
  addLimb(leftWrist, leftHand, handWidth);
  addLimb(getPoint(12), getPoint(14), upperArmWidth);
  addLimb(getPoint(14), rightWrist, lowerArmWidth);
  addLimb(rightWrist, rightHand, handWidth);
  ctx.ellipse(headCenter.x, headCenter.y, headRadiusX, headRadiusY, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  drawSilhouetteContour(ctx, style, () =>
    appendTorsoPath(ctx, shoulderCenter, hipCenter, axisX, axisY, normalX, normalY, torsoLength, shoulderWidth, hipWidth)
  );
  drawSilhouetteContour(ctx, style, () => {
    ctx.ellipse(headCenter.x, headCenter.y, headRadiusX, headRadiusY, 0, 0, Math.PI * 2);
  });
  drawLimbContours(ctx, limbs, style);
}
