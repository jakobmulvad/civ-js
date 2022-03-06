export type UiScreen = {
  onFocus?: () => void;
  onBlur?: () => void;
  onRender?: (time: number) => void;
  onClick?: (x: number, y: number) => void;
  onKey?: (keyCode: string) => void;
};

let uiStack: UiScreen[] = [];

export const uiPushScreen = (screen: UiScreen) => {
  uiStack.push(screen);
};

export const uiPopScreen = () => {
  uiStack.pop();
};

export const uiClear = () => {
  uiStack = [];
};

export const uiTopScreen = (): UiScreen | undefined => {
  return uiStack[uiStack.length - 1];
};

export const uiRender = (time: number) => {
  for (const screen of uiStack) {
    screen.onRender?.(time);
  }
};

document.addEventListener("keydown", (evt) => {
  console.log("keydown", evt.code);
  const screen = uiTopScreen();
  screen?.onKey?.(evt.code);
});

const canvas: HTMLCanvasElement = document.querySelector("#game-canvas");

canvas.addEventListener("mousedown", (evt) => {
  const canvasBounds = canvas.getBoundingClientRect();
  const screenX = Math.floor((evt.offsetX * 320) / canvasBounds.width);
  const screenY = Math.floor((evt.offsetY * 200) / canvasBounds.height);

  const screen = uiTopScreen();
  screen?.onClick?.(screenX, screenY);
});

const frameHandler = (time: number) => {
  requestAnimationFrame(frameHandler);
  uiRender(time);
};
requestAnimationFrame(frameHandler);
