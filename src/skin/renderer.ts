import type { ControlDef, SkinConfig, SpriteDef } from "./types";

export type RenderState = Record<string, number> & { smoothing?: boolean };

type ImageMap = Record<string, HTMLImageElement>;

export function drawRect(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  sprite: SpriteDef,
  dx: number,
  dy: number,
  dw: number,
  dh: number
) {
  if (sprite.kind !== "rect") return;
  ctx.drawImage(
    image,
    sprite.sx,
    sprite.sy,
    sprite.sw,
    sprite.sh,
    dx,
    dy,
    dw,
    dh
  );
}

export function drawStripFrame(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  sprite: SpriteDef,
  frameIndex: number,
  dx: number,
  dy: number,
  dw: number,
  dh: number
) {
  if (sprite.kind !== "strip") return;
  const clamped = ((frameIndex % sprite.frames) + sprite.frames) % sprite.frames;
  const gapX = sprite.frameGapX ?? 0;
  const gapY = sprite.frameGapY ?? 0;
  const stepX = sprite.frameW + gapX;
  const stepY = sprite.frameH + gapY;
  const fx = sprite.direction === "h" ? sprite.x + clamped * stepX : sprite.x;
  const fy = sprite.direction === "v" ? sprite.y + clamped * stepY : sprite.y;
  ctx.drawImage(
    image,
    fx,
    fy,
    sprite.frameW,
    sprite.frameH,
    dx,
    dy,
    dw,
    dh
  );
}

export function renderSkin(
  ctx: CanvasRenderingContext2D,
  skinConfig: SkinConfig,
  images: ImageMap,
  state?: RenderState
) {
  ctx.imageSmoothingEnabled = state?.smoothing ?? false;
  ctx.clearRect(0, 0, skinConfig.canvas.width, skinConfig.canvas.height);

  if (skinConfig.canvas.background) {
    const bg = images[skinConfig.canvas.background];
    if (bg) {
      ctx.drawImage(bg, 0, 0);
    }
  }

  for (const control of skinConfig.controls) {
    if (control.hidden) continue;
    const sprite = skinConfig.sprites[control.spriteKey];
    const image = sprite ? images[sprite.image] : undefined;
    if (!sprite || !image) continue;

    const scale = control.scale ?? 1;
    const dw = control.w * scale;
    const dh = control.h * scale;

    if (sprite.kind === "rect") {
      drawRect(ctx, image, sprite, control.x, control.y, dw, dh);
      continue;
    }

    const frameIndex =
      typeof control.frameIndex === "number"
        ? control.frameIndex
        : state?.[control.id] ?? 0;
    drawStripFrame(ctx, image, sprite, frameIndex, control.x, control.y, dw, dh);
  }
}
