import { addGameEventListener } from '../game-event';
import { Rect } from '../helpers';
import { renderMinimap } from '../renderer';
import { UiWindow } from './ui-controller';
import { centerViewport, mapViewport } from './ui-worldview-map';

const area: Rect = {
  x: 0,
  y: 8,
  width: 80,
  height: 50,
};

export const minimapWindow: UiWindow = {
  area,
  isDirty: true,
  onRender: (state) => {
    const { gameState, localPlayer } = state;
    renderMinimap(gameState, localPlayer, area, mapViewport);
  },
  onClick: (x, y) => {
    const offsetX = mapViewport.x - ((area.width - mapViewport.width) >> 1);
    const offsetY = mapViewport.y - ((area.height - mapViewport.height) >> 1);
    centerViewport(offsetX + x, offsetY + y);
  },
};

addGameEventListener(['GameStateUpdated', 'ViewportChanged'], () => {
  minimapWindow.isDirty = true;
});
