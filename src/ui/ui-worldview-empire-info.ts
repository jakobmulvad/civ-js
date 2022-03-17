import { fonts } from '../fonts';
import { addGameEventListener } from '../game-event';
import { Rect } from '../helpers';
import { turnToYear } from '../logic/formulas';
import { palette } from '../palette';
import { renderGrayBox, renderSprite, renderText, setFontColor } from '../renderer';
import { UiWindow } from './ui-controller';
import { UiState } from './ui-state';

const area: Rect = { x: 0, y: 58, width: 80, height: 39 };

export const empireInfoWindow: UiWindow = {
  area,
  isDirty: true,
  onRender: (state: UiState) => {
    const { gameState, localPlayer } = state;
    const player = gameState.players[localPlayer];

    setFontColor(fonts.main, palette.black);

    renderGrayBox(area.x, area.y, area.width, area.height);
    renderText(fonts.main, '40,000#', 2, 73); // todo: add population calculations
    const textOffset = renderText(fonts.main, turnToYear(gameState.turn), 2, 81);
    renderSprite('sp299.pic.png', 20 * 8, 15 * 8, textOffset + 2, 80, 8, 8); // todo: change light bulb based on research progress
    renderText(fonts.main, `${player.gold}$ 0.5.5`, 2, 89); // todo: add gold and tax rates
  },
};

addGameEventListener('GameStateUpdated', () => {
  empireInfoWindow.isDirty = true;
});
