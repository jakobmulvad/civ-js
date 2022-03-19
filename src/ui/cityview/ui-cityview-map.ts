import { getImageAsset } from '../../assets';
import { triggerGameEvent } from '../../game-event';
import { Rect } from '../../helpers';
import { calculateCitizens, workedTileCoords, workedTileToIndex } from '../../logic/city';
import { getUnitsAt } from '../../logic/game-state';
import { calculateTileYield, getTileAt, wrapXAxis } from '../../logic/map';
import { renderBlueBox, renderCity, renderTileTerrain, renderYield } from '../../renderer';
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
          const tileYield = calculateTileYield(tile);
          renderYield(sp257.canvas, tileYield, screenX, screenY);
        }
      }
    }

    for (const i of selectedCity.workedTiles) {
      const [x, y] = workedTileCoords[i];
      const mapX = (selectedCity.x + x + map.width) % map.width; // wrap-around on x-axis
      const mapY = selectedCity.y + y;
      const tile = getTileAt(map, mapX, mapY);
      const tileYield = calculateTileYield(tile);
      const screenX = area.x + 32 + x * 16 + 1;
      const screenY = area.y + 32 + y * 16 + 1;
      renderYield(sp257.canvas, tileYield, screenX, screenY);
    }
  },
  onClick: (x: number, y: number) => {
    const { gameState, selectedCity, localPlayer } = getUiState();
    if (!selectedCity) {
      return;
    }
    const player = gameState.players[localPlayer];
    const map = player.map;

    const relX = (x >> 4) - 2;
    const relY = (y >> 4) - 2;

    const mapX = wrapXAxis(map, selectedCity.x + relX);
    const mapY = selectedCity.y + relY;
    const tile = getTileAt(map, mapX, mapY);

    if (tile.hidden || Math.abs(x) + Math.abs(y) === 4) {
      return;
    }

    const tileIndex = workedTileToIndex(relX, relY);
    if (tileIndex === undefined) {
      return;
    }

    const isWorked = selectedCity.workedTiles.includes(tileIndex);

    if (isWorked) {
      console.log('removing worked tile', tileIndex);
      selectedCity.workedTiles = selectedCity.workedTiles.filter((idx) => idx !== tileIndex);
    } else if (selectedCity.size > selectedCity.workedTiles.length) {
      console.log('adding worked tile', tileIndex);
      selectedCity.workedTiles.push(tileIndex);
    } else {
      // TODO: automatic worker placement
    }

    cityMapWindow.isDirty = true;
    calculateCitizens(map, selectedCity);
    triggerGameEvent('CityViewUpdated');

    console.log(relX, relY);
  },
};
