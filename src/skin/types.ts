export type SpriteStripDef = {
  kind: "strip";
  image: string;
  x: number;
  y: number;
  frameW: number;
  frameH: number;
  frames: number;
  direction: "h" | "v";
  frameGapX?: number;
  frameGapY?: number;
};

export type SpriteRectDef = {
  kind: "rect";
  image: string;
  sx: number;
  sy: number;
  sw: number;
  sh: number;
};

export type SpriteDef = SpriteStripDef | SpriteRectDef;

export type ControlDef = {
  id: string;
  type: "sprite" | "stripFrame";
  spriteKey: string;
  x: number;
  y: number;
  w: number;
  h: number;
  frameIndex?: number;
  scale?: number;
  hidden?: boolean;
  paramId?: string;
  min?: number;
  max?: number;
};

export type SkinConfig = {
  canvas: {
    width: number;
    height: number;
    background?: string;
  };
  sprites: Record<string, SpriteDef>;
  controls: ControlDef[];
};
