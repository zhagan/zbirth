import { useCallback, useEffect, useRef, useState } from "react";
import type { SkinConfig } from "../skin/types";
import type { RbmBundle } from "./rbmTypes";
import { bundleToImageMap, revokeBundleImages } from "./rbmAssets";
import { parseRbm } from "./rbmParse";

export function useRbmMod({ skinJson }: { skinJson?: SkinConfig }) {
  const [bundle, setBundle] = useState<RbmBundle | null>(null);
  const [images, setImages] = useState<Record<string, HTMLImageElement>>({});
  const [missing, setMissing] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const bundleRef = useRef<RbmBundle | null>(null);

  useEffect(() => {
    bundleRef.current = bundle;
  }, [bundle]);

  useEffect(() => {
    if (!bundle || !skinJson) {
      setImages({});
      setMissing([]);
      return;
    }

    let cancelled = false;
    const spriteNames = Array.from(
      new Set(Object.values(skinJson.sprites).map((sprite) => sprite.image))
    );
    const present = spriteNames.filter((name) => bundle.entries.has(name));
    setMissing(spriteNames.filter((name) => !bundle.entries.has(name)));

    if (present.length === 0) {
      setImages({});
      return;
    }

    bundleToImageMap(bundle, present)
      .then((imageMap) => {
        if (!cancelled) {
          setImages(imageMap);
        }
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) {
          setImages({});
        }
      });

    return () => {
      cancelled = true;
    };
  }, [bundle, skinJson]);

  useEffect(() => {
    return () => {
      if (bundleRef.current) {
        revokeBundleImages(bundleRef.current);
      }
    };
  }, []);

  const loadRbmFile = useCallback(async (file: File) => {
    setLoading(true);
    try {
      if (bundleRef.current) {
        revokeBundleImages(bundleRef.current);
      }
      const arrayBuffer = await file.arrayBuffer();
      const parsed = parseRbm(arrayBuffer);
      setBundle(parsed);
    } finally {
      setLoading(false);
    }
  }, []);

  return { loadRbmFile, bundle, images, missing, loading };
}
