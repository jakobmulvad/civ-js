let lastFrameTime = 0;
let animateCallback: undefined | ((time: number) => void);

const frameHandler = (time: number) => {
  lastFrameTime = time;
  requestAnimationFrame(frameHandler);
  animateCallback?.(time);
};
requestAnimationFrame(frameHandler);

export const isAnimating = (): boolean => !!animateCallback;

export const animate = (callback: (time: number) => boolean): Promise<void> => {
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
