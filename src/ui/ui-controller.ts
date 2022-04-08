import { postRenderFrame, preRenderFrame } from '../animation';
import { waitForAssets } from '../assets';
import { isInside, Rect } from '../helpers';
import { KeyCode } from '../key-codes';
import { clearUiActionQueue } from './ui-action-queue';
import { getUiState, UiState } from './ui-state';

export type UiWindow = {
  area?: Rect;
  isDirty: boolean;
  onRender: (state: UiState, time: number) => void;
  onKey?: (keyCode: KeyCode, shift: boolean) => void;
  onMouseDown?: (x: number, y: number) => void;
  onMouseDrag?: (x: number, y: number) => void;
  onMouseUp?: (x: number, y: number) => void;
  onClick?: (x: number, y: number) => void;
  onMount?: () => void;
};

export type UiScreen = {
  onKey?: (keyCode: KeyCode, shift: boolean) => void;
  windows: UiWindow[];
};

let uiStack: UiScreen[] = [];
let isDirty = true; // force rerender?
let mouseLock: UiWindow | undefined = undefined;

export const pushUiScreen = (screen: UiScreen) => {
  uiStack.push(screen);

  for (const window of screen.windows) {
    window.onMount?.();
  }

  isDirty = true;
};
export const popUiScreen = () => {
  uiStack.pop();
  isDirty = true;
};
export const clearUi = () => {
  uiStack = [];
  clearUiActionQueue();
  isDirty = true;
};

export const topUiScreen = (): UiScreen | undefined => {
  return uiStack[uiStack.length - 1];
};

export const uiRender = (time: number) => {
  const screen = topUiScreen();
  if (!screen) {
    return;
  }

  const state = getUiState();

  for (const window of screen.windows) {
    if (isDirty || window.isDirty) {
      window.onRender(state, time);
      window.isDirty = false;
    }
  }
  isDirty = false;
};

document.addEventListener('keydown', (evt) => {
  const screen = topUiScreen();

  if (screen) {
    screen.onKey?.(evt.code as KeyCode, evt.shiftKey);
    for (const window of screen.windows) {
      window.onKey?.(evt.code as KeyCode, evt.shiftKey);
    }
  }
});

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');

if (!canvas) {
  throw new Error('Could not find game canvas');
}

const toIngameCoords = (canvasX: number, canvasY: number): [number, number] => {
  const canvasBounds = canvas.getBoundingClientRect();
  const screenX = Math.floor((canvasX * 320) / canvasBounds.width);
  const screenY = Math.floor((canvasY * 200) / canvasBounds.height);
  return [screenX, screenY];
};

canvas.addEventListener('mousedown', (evt) => {
  const screen = topUiScreen();
  if (!screen) {
    return;
  }

  const [x, y] = toIngameCoords(evt.offsetX, evt.offsetY);

  for (let i = screen.windows.length - 1; i >= 0; i--) {
    const window = screen.windows[i];
    if (window.area && isInside(window.area, x, y)) {
      window.onMouseDown?.(x - window.area.x, y - window.area.y);
      mouseLock = window;
      return;
    }
  }
});

canvas.addEventListener('mousemove', (evt) => {
  if (mouseLock && mouseLock.area) {
    const [x, y] = toIngameCoords(evt.offsetX, evt.offsetY);
    mouseLock.onMouseDrag?.(x - mouseLock.area.x, y - mouseLock.area.y);
  }
});

canvas.addEventListener('mouseup', (evt) => {
  if (!mouseLock || !mouseLock.area) {
    return;
  }

  const [x, y] = toIngameCoords(evt.offsetX, evt.offsetY);
  mouseLock.onMouseUp?.(x - mouseLock.area.x, y - mouseLock.area.y);
  if (mouseLock.onClick && isInside(mouseLock.area, x, y)) {
    mouseLock.onClick(x - mouseLock.area.x, y - mouseLock.area.y);
  }
  mouseLock = undefined;
});

const frameHandler = (time: number) => {
  preRenderFrame(time);
  uiRender(time);
  postRenderFrame(time);
  requestAnimationFrame(frameHandler);
};

waitForAssets()
  .then(() => {
    requestAnimationFrame(frameHandler);
  })
  .catch((err) => console.error(`Failed to load assets: ${err as string}`));
