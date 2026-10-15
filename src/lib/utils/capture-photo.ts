export function capturePhoto(video: HTMLVideoElement, isMirrored: boolean): string {
  if (!video.videoWidth || !video.videoHeight) return '';

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  if (isMirrored) {
    ctx.translate(video.videoWidth, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.92);
}
