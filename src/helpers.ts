export const randomIntBelow = (max: number): number => Math.floor(Math.random() * max);

export const clamp = (min: number, val: number, max: number) => Math.max(min, Math.min(val, max));
