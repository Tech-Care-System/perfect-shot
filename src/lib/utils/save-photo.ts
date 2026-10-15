function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const match = parts[0].match(/:(.*?);/);
  const mime = match ? match[1] : 'image/jpeg';
  const bytes = atob(parts[1]);
  const array = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    array[i] = bytes.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
}

function generateFilename(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `ai-perfect-shot-${date}-${time}.jpg`;
}

export function savePhoto(dataUrl: string): void {
  try {
    const blob = dataUrlToBlob(dataUrl);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = generateFilename();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  } catch {
    // Silent failure — download failed but app continues
  }
}
