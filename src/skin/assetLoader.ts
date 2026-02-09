const imageCache = new Map<string, HTMLImageElement>();
const imagePromiseCache = new Map<string, Promise<HTMLImageElement>>();

export function loadImage(url: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(url);
  if (cached && cached.complete) {
    return Promise.resolve(cached);
  }

  const pending = imagePromiseCache.get(url);
  if (pending) {
    return pending;
  }

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(url, img);
      imagePromiseCache.delete(url);
      resolve(img);
    };
    img.onerror = () => {
      imagePromiseCache.delete(url);
      reject(new Error(`Failed to load image: ${url}`));
    };
    img.src = url;
  });

  imagePromiseCache.set(url, promise);
  return promise;
}

export async function loadImagesByKey(
  sources: Record<string, string>
): Promise<Record<string, HTMLImageElement>> {
  const entries = await Promise.all(
    Object.entries(sources).map(async ([key, url]) => [key, await loadImage(url)])
  );

  return Object.fromEntries(entries);
}

export function setCanvasImageSmoothing(
  ctx: CanvasRenderingContext2D,
  enabled = false
) {
  ctx.imageSmoothingEnabled = enabled;
}
