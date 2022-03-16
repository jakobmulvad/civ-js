import { addGameEventListener } from '../game-controller-event';
import { Rect } from '../helpers';
import { palette } from '../palette';
import { renderWindow } from '../renderer';
import { UiWindow } from './ui-controller';

const area: Rect = {
  x: 0,
  y: 8,
  width: 80,
  height: 50,
};

export const minimapWindow: UiWindow = {
  area,
  isDirty: true,
  onRender: () => {
    renderWindow(0, 8, 80, 50, palette.black);
  },
};

addGameEventListener('GameStateUpdated', () => {
  minimapWindow.isDirty = true;
});
