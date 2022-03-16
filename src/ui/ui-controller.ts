import { postRenderFrame, preRenderFrame } from '../animation';
import { waitForAssets } from '../assets';
import { isInside, Rect } from '../helpers';
import { clearUiEventQueue } from './ui-event-queue';
import { getUiState, UiState } from './ui-state';

export type UiWindow = {
  area: Rect;
  isDirty: boolean;
  //onUpdate?: (time: number, state: UiState) => boolean;
  onRender: (state: UiState, time: number) => void;
  onClick?: (x: number, y: number) => void;
};

export type UiScreen = {
  onFocus?: () => void;
  onBlur?: () => void;
  onKey?: (keyCode: string) => void;
  windows: UiWindow[];
};

let uiStack: UiScreen[] = [];

export const pushUiScreen = (screen: UiScreen) => uiStack.push(screen);
export const popUiScreen = () => uiStack.pop();
export const clearUi = () => {
  uiStack = [];
  clearUiEventQueue();
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
    //if (!window.onUpdate || window.onUpdate(time, state)) {
    if (window.isDirty) {
      window.onRender(state, time);
      window.isDirty = false;
    }
  }
};

document.addEventListener('keydown', (evt) => {
  console.log('keydown', evt.code);
  const screen = topUiScreen();
  screen?.onKey?.(evt.code);
});

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');

canvas?.addEventListener('mousedown', (evt) => {
  const screen = topUiScreen();
  if (!screen) {
    return;
  }

  const canvasBounds = canvas.getBoundingClientRect();
  const screenX = Math.floor((evt.offsetX * 320) / canvasBounds.width);
  const screenY = Math.floor((evt.offsetY * 200) / canvasBounds.height);

  for (const window of screen.windows) {
    if (window.onClick && isInside(window.area, screenX, screenY)) {
      window.onClick(screenX - window.area.x, screenY - window.area.y);
    }
  }
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
