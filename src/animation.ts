import { UiWindow } from './ui/ui-controller';

let lastFrameTime = 0;
type InternalAnimationCallback = undefined | ((time: number) => void);

let preRenderCallback: InternalAnimationCallback;
let postRenderCallback: InternalAnimationCallback;

export const isAnimating = (): boolean => !!preRenderCallback;

export type AnimationOptions = {
  duration: number;
  from?: number;
  window?: UiWindow;
  to: number;
  onRender: (value: number) => void;
};

export const startAnimation = (options: AnimationOptions): Promise<void> => {
  const animationStartTime = lastFrameTime;
  const from = options.from ?? 0;

  return new Promise((res, rej) => {
    if (isAnimating()) {
      rej(new Error('Already animating'));
      return;
    }

    let currentValue = -1;
    preRenderCallback = (time: number) => {
      const progress = (time - animationStartTime) / options.duration;
      if (progress > 1) {
        currentValue = options.to;
        preRenderCallback = undefined;
        res();
        return;
      }

      const newValue = Math.floor(from + (options.to - from) * progress);

      if (newValue !== currentValue) {
        if (options.window) {
          options.window.isDirty = true;
        }
        currentValue = newValue;
      }
    };

    postRenderCallback = () => {
      options.onRender(currentValue);
      if (currentValue === options.to) {
        postRenderCallback = undefined;
        if (options.window) {
          options.window.isDirty = true;
        }
      }
    };
  });
};

export const preRenderFrame = (time: number) => {
  lastFrameTime = time;
  preRenderCallback?.(time);
};

export const postRenderFrame = (time: number) => {
  postRenderCallback?.(time);
};
