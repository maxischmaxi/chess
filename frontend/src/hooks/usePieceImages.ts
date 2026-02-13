import { useEffect, useState } from "react";

const PIECES = [
  "wK",
  "wQ",
  "wR",
  "wB",
  "wN",
  "wP",
  "bK",
  "bQ",
  "bR",
  "bB",
  "bN",
  "bP",
];

export function usePieceImages(): Map<string, HTMLImageElement> | null {
  const [images, setImages] = useState<Map<string, HTMLImageElement> | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const map = new Map<string, HTMLImageElement>();
      const promises = PIECES.map(
        (name) =>
          new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              map.set(name, img);
              resolve();
            };
            img.onerror = reject;
            img.src = `/pieces/${name}.svg`;
          }),
      );

      await Promise.all(promises);
      if (!cancelled) setImages(map);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return images;
}
