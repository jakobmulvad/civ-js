import { fonts } from '../fonts';
import { addGameEventListener } from '../game-event';
import { Rect } from '../helpers';
import { numberFormatter } from '../logic/city';
import { cityPopulation, turnToYear } from '../logic/formulas';
import { palette } from '../palette';
import { renderGrayBox, renderSprite, renderText } from '../renderer';
import { UiWindow } from './ui-controller';
import { UiState } from './ui-state';

const area: Rect = { x: 0, y: 58, width: 80, height: 39 };

export const empireInfoWindow: UiWindow = {
  area,
  isDirty: true,
  onRender: (state: UiState) => {
    const { gameState, localPlayer } = state;
    const player = gameState.players[localPlayer];
    const scienceRate = 10 - player.taxRate - player.luxuryRate;

    const empirePopulation = player.cities.reduce((acc, city) => acc + cityPopulation(city.size), 0);

    renderGrayBox(area.x, area.y, area.width, area.height);
    renderText(fonts.main, `${numberFormatter.format(empirePopulation)}#`, 2, 73, palette.black); // todo: add population calculations
    const textOffset = renderText(fonts.main, turnToYear(gameState.turn), 2, 81, palette.black);
    renderSprite({ asset: 'sp299.pic.png', x: 20 * 8, y: 15 * 8, width: 8, height: 8 }, textOffset + 2, 80); // todo: change light bulb based on research progress
    renderText(
      fonts.main,
      `${player.gold}$ ${player.luxuryRate}.${scienceRate}.${player.taxRate}`,
      2,
      89,
      palette.black
    );
  },
};

addGameEventListener('GameStateUpdated', () => {
  empireInfoWindow.isDirty = true;
});
