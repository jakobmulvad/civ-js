import { fonts } from '../fonts';
import { addGameEventListener } from '../game-event';
import { Rect } from '../helpers';
import { getPrototype, getSelectedUnitForPlayer, getTileAtUnit, homeCityName } from '../logic/game-state';
import { terrainMap } from '../logic/map';
import { palette } from '../palette';
import { renderGrayBox, renderText, renderTextLines, setFontColor } from '../renderer';
import { UiWindow } from './ui-controller';
import { pushUiAction } from './ui-action-queue';
import { getUiState, UiState } from './ui-state';

const area: Rect = { x: 0, y: 97, width: 80, height: 103 };

export const unitInfoWindow: UiWindow = {
  area,
  isDirty: true,
  onRender: (state: UiState) => {
    renderGrayBox(0, 97, 80, 103);

    const { gameState } = state;

    if (gameState.playerInTurn !== state.localPlayer) {
      return;
    }

    const player = gameState.players[state.localPlayer];
    const selectedUnit = getSelectedUnitForPlayer(gameState, state.localPlayer);

    setFontColor(fonts.main, palette.black);
    if (selectedUnit) {
      const prototype = getPrototype(selectedUnit);
      const tile = getTileAtUnit(player.map, selectedUnit);
      const terrain = terrainMap[tile.terrain];
      const wholeMoves = Math.floor(selectedUnit.movesLeft / 3);
      const fractionMoves = selectedUnit.movesLeft % 3;

      renderTextLines(
        fonts.main,
        [
          player.civ.name,
          prototype.name,
          selectedUnit.isVeteran ? ' Veteran' : undefined,
          `Moves: ${fractionMoves === 0 ? wholeMoves : `${wholeMoves}.${fractionMoves}`}`,
          homeCityName(gameState, selectedUnit),
          `(${terrain.name})`,
          tile.hasRoad ? `(Road)` : undefined,
          tile.hasRailroad ? `(Railroad)` : undefined,
          tile.hasIrrigation ? `(Irrigation)` : undefined,
          tile.hasMine ? `(Mine)` : undefined,
        ],
        3,
        99
      );
      return;
    }

    state.isBlinking && renderText(fonts.main, 'End of Turn', 3, 125);
    renderText(fonts.main, 'Press Enter', 3, 138);
    renderText(fonts.main, 'to continue', 3, 146);
  },
  onClick: () => {
    const { gameState, localPlayer } = getUiState();
    if (gameState.playerInTurn === localPlayer && !getSelectedUnitForPlayer(gameState, localPlayer)) {
      pushUiAction({ type: 'EndTurn', player: localPlayer });
    }
  },
};

addGameEventListener('GameStateUpdated', () => {
  unitInfoWindow.isDirty = true;
});

addGameEventListener('BlinkingStateUpdated', () => {
  const { gameState, localPlayer } = getUiState();

  if (gameState.playerInTurn === localPlayer && getSelectedUnitForPlayer(gameState, localPlayer) === undefined) {
    unitInfoWindow.isDirty = true;
  }
});
