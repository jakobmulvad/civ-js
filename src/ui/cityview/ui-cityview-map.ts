import { getImageAsset } from '../../assets';
import { addGameEventListener } from '../../game-event';
import { Rect } from '../../helpers';
import { getBlockedWorkableTiles, getCityAt, workedTileToCoord, workedTileToIndex } from '../../logic/city';
import { getUnitsAt } from '../../logic/game-state';
import { calculateTileYield, getTileAt, wrapXAxis } from '../../logic/map';
import { palette } from '../../palette';
import { renderBlueBox, renderCity, renderFrame, renderTileTerrain, renderTileYield, renderUnit } from '../../renderer';
import { pushUiAction } from '../ui-action-queue';
import { UiWindow } from '../ui-controller';
import { getUiState } from '../ui-state';

const area: Rect = {
  x: 127,
  y: 23,
  width: 82,
  height: 82,
};

export const cityMapWindow: UiWindow = {
  area,
  isDirty: true,
  onRender: (state) => {
    const { selectedCity, localPlayer, gameState } = state;
    if (!selectedCity) {
      return;
    }
    renderBlueBox(area.x, area.y, area.width, area.height);

    const player = gameState.players[localPlayer];
    const { primaryColor, secondaryColor } = player.civ;
    const map = player.map;
    const units = getUnitsAt(gameState, selectedCity.x, selectedCity.y);
    const occupiedTiles = getBlockedWorkableTiles(gameState, selectedCity);

    const ter257 = getImageAsset('ter257.pic.gif').canvas;
    const sp257 = getImageAsset('sp257.pic.png');
    for (let x = -2; x < 3; x++) {
      for (let y = -2; y < 3; y++) {
        const mapX = wrapXAxis(map, selectedCity.x + x); // wrap-around on x-axis
        const mapY = selectedCity.y + y;
        const tile = getTileAt(map, mapX, mapY);

        if (tile.hidden || Math.abs(x) + Math.abs(y) === 4) {
          continue;
        }

        const screenX = area.x + 32 + x * 16 + 1;
        const screenY = area.y + 32 + y * 16 + 1;
        const isCenter = x === 0 && y === 0;
        renderTileTerrain(ter257, sp257.canvas, map, mapX, mapY, screenX, screenY, isCenter);

        if (isCenter) {
          renderCity(sp257, selectedCity, screenX, screenY, primaryColor, secondaryColor, units.length > 0);
          const tileYield = calculateTileYield(tile, player.government);
          renderTileYield(sp257.canvas, tileYield, screenX, screenY);
          continue;
        }

        const tileCity = getCityAt(gameState, mapX, mapY);
        const tileUnits = getUnitsAt(gameState, mapX, mapY);

        if (tileCity) {
          const { primaryColor, secondaryColor } = gameState.players[tileCity.owner].civ;
          renderCity(sp257, tileCity, screenX, screenY, primaryColor, secondaryColor, tileUnits.length > 0);
        } else if (tileUnits.length && tileUnits[0].owner !== localPlayer) {
          renderUnit(sp257.canvas, tileUnits[0], screenX, screenY, tileUnits.length > 1);
        }

        const tileIndex = workedTileToIndex(x, y);
        if (occupiedTiles.includes(tileIndex)) {
          renderFrame(screenX, screenY, 16, 16, palette.red);
        }
      }
    }

    for (const i of selectedCity.workedTiles) {
      const [x, y] = workedTileToCoord(i);
      const mapX = wrapXAxis(map, selectedCity.x + x);
      const mapY = selectedCity.y + y;
      const tile = getTileAt(map, mapX, mapY);
      const tileYield = calculateTileYield(tile, player.government);
      const screenX = area.x + 32 + x * 16 + 1;
      const screenY = area.y + 32 + y * 16 + 1;
      renderTileYield(sp257.canvas, tileYield, screenX, screenY);
    }
  },
  onClick: (x: number, y: number) => {
    const { gameState, selectedCity, localPlayer } = getUiState();
    const player = gameState.players[localPlayer];
    const cityIndex = player.cities.indexOf(selectedCity!);
    if (!selectedCity || cityIndex === -1) {
      return;
    }
    const map = player.map;

    const dx = ((x - 1) >> 4) - 2;
    const dy = ((y - 1) >> 4) - 2;

    const mapX = wrapXAxis(map, selectedCity.x + dx);
    const mapY = selectedCity.y + dy;
    const tile = getTileAt(map, mapX, mapY);

    if (tile.hidden || Math.abs(dx) > 2 || Math.abs(dy) > 2 || Math.abs(dx) + Math.abs(dy) === 4) {
      return;
    }

    const tileIndex = workedTileToIndex(dx, dy);
    if (tileIndex === undefined) {
      return;
    }

    pushUiAction({
      type: 'CityToggleTileWorker',
      player: localPlayer,
      city: cityIndex,
      tile: tileIndex,
    });
  },
};

addGameEventListener('GameStateUpdated', () => (cityMapWindow.isDirty = true));
