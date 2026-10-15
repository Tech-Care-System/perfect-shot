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
