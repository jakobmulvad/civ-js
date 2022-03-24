export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const isInside = (rect: Rect, x: number, y: number) => {
  return x >= rect.x && y >= rect.y && x < rect.x + rect.width && y < rect.y + rect.height;
};

export const randomIntBelow = (max: number): number => Math.floor(Math.random() * max);

export const randomIntBetween = (min: number, max: number) => randomIntBelow(max - min) + min;

export const clamp = (min: number, val: number, max: number) => Math.max(min, Math.min(val, max));

export const incrementPerIcon = (count: number, width: number) => Math.min(8, Math.floor(width / count));
