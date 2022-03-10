let lastFrameTime = 0;
let animateCallback: undefined | ((time: number) => void);

export const isAnimating = (): boolean => !!animateCallback;

export const startAnimation = (callback: (time: number) => boolean): Promise<void> => {
  return new Promise((res, rej) => {
    if (isAnimating()) {
      rej(new Error('Already animating'));
      return;
    }

    const animationStartTime = lastFrameTime;

    animateCallback = (time: number) => {
      if (callback?.(time - animationStartTime)) {
        animateCallback = undefined;
        res();
      }
    };
  });
};

export const animateFrame = (time: number) => {
  lastFrameTime = time;
  animateCallback?.(time);
};
