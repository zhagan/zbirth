import type { RbmBundle } from "./rbmTypes";

const bundleUrlCache = new WeakMap<RbmBundle, string[]>();

export async function bundleToImageMap(
  bundle: RbmBundle,
  names: string[]
): Promise<Record<string, HTMLImageElement>> {
  revokeBundleImages(bundle);
  const uniqueNames = Array.from(new Set(names));
  const map: Record<string, HTMLImageElement> = {};
  const urls: string[] = [];

  for (const name of uniqueNames) {
    const entry = bundle.entries.get(name);
    if (!entry) continue;
    const blob = new Blob([entry.data], {
      type: entry.mime ?? "application/octet-stream",
    });
    const url = URL.createObjectURL(blob);
    urls.push(url);
    const image = new Image();
    await new Promise<HTMLImageElement>((resolve, reject) => {
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Failed to load ${name}`));
      image.src = url;
    });
    map[name] = image;
  }

  bundleUrlCache.set(bundle, urls);
  return map;
}

export function revokeBundleImages(bundle: RbmBundle) {
  const urls = bundleUrlCache.get(bundle);
  if (!urls) return;
  urls.forEach((url) => URL.revokeObjectURL(url));
  bundleUrlCache.delete(bundle);
}

export function bundleGetArrayBuffer(bundle: RbmBundle, name: string): ArrayBuffer | null {
  const entry = bundle.entries.get(name);
  if (!entry) return null;
  return entry.data.buffer.slice(
    entry.data.byteOffset,
    entry.data.byteOffset + entry.data.byteLength
  );
}
