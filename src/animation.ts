let lastFrameTime = 0;
type InternalAnimationCallback = undefined | ((time: number) => void);

let preRenderCallback: InternalAnimationCallback;
let postRenderCallback: InternalAnimationCallback;

export const isAnimating = (): boolean => !!preRenderCallback;

export type AnimationOptions = {
  duration: number;
  from: number;
  to: number;
  onUpdate?: (value: number) => void;
  onRender?: (value: number) => void;
};

export const startAnimation = (options: Omit<AnimationOptions, 'from'> & { from?: number }): Promise<void> => {
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
        options.onUpdate?.(options.to);
        currentValue = options.to;
        preRenderCallback = undefined;
        res();
        return;
      }

      const newValue = Math.floor(from + (options.to - from) * progress);

      if (newValue !== currentValue) {
        options.onUpdate?.(newValue);
        currentValue = newValue;
      }
    };

    if (options.onRender) {
      postRenderCallback = (time: number) => {
        options.onRender?.(currentValue);
        if (currentValue === options.to) {
          postRenderCallback = undefined;
        }
      };
    }
  });
};

export const preRenderFrame = (time: number) => {
  lastFrameTime = time;
  preRenderCallback?.(time);
};

export const postRenderFrame = (time: number) => {
  postRenderCallback?.(time);
};
