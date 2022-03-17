import { startAnimation } from '../animation';
import { getImageAsset } from '../assets';
import { addGameEventListener, triggerGameEvent } from '../game-event';
import { Rect } from '../helpers';
import { getCityAt } from '../logic/city';
import { UnitCombatResult, UnitMoveResult } from '../logic/civ-game';
import { getSelectedUnitForPlayer, getUnitsAt } from '../logic/game-state';
import { Unit } from '../logic/units';
import { renderCity, renderSprite, renderTileTerrain, renderUnit } from '../renderer';
import { UiWindow } from './ui-controller';
import { getUiState } from './ui-state';

export const mapViewport: Rect = {
  x: 0,
  y: 0,
  width: 15,
  height: 12,
};

const area: Rect = {
  x: 320 - 15 * 16,
  y: 200 - 12 * 16,
  width: mapViewport.width * 16,
  height: mapViewport.height * 16,
};

let excludeUnitInRender: Unit | undefined;

const mapCoordToScreenX = (mapWidth: number, x: number): number => {
  return area.x + Math.max(x - mapViewport.x, (x - mapViewport.x + mapWidth) % mapWidth) * 16;
};

const mapCoordToScreenY = (y: number): number => {
  return area.y + (y - mapViewport.y) * 16;
};

export const animateUnitMoved = async (result: UnitMoveResult) => {
  const { gameState } = getUiState();
  const sp257 = getImageAsset('sp257.pic.gif').canvas;

  const { dx, dy, unit } = result;

  const screenX = mapCoordToScreenX(gameState.masterMap.width, unit.x);
  const screenY = mapCoordToScreenY(unit.y);

  excludeUnitInRender = unit;
  await startAnimation({
    duration: 15 * 16, // 15 ms per frame
    to: 16,
    window: mapWindow,
    onRender: (value) => {
      renderUnit(sp257, unit, screenX - (16 - value) * dx, screenY - (16 - value) * dy);
    },
  });
  excludeUnitInRender = undefined;
};

export const animateCombat = async (result: UnitCombatResult) => {
  const { gameState } = getUiState();
  const ter257 = getImageAsset('ter257.pic.gif').canvas;
  const sp257 = getImageAsset('sp257.pic.gif').canvas;
  const { dx, dy, attacker, defender } = result;

  const loser = result.winner === 'Attacker' ? defender : attacker;
  const winner = result.winner === 'Attacker' ? attacker : defender;
  const mapWidth = gameState.masterMap.width;
  const loserScreenX = mapCoordToScreenX(mapWidth, loser.x);
  const loserScreenY = mapCoordToScreenY(loser.y);

  excludeUnitInRender = winner;

  const renderUnitAt = (unit: Unit, offsetX = 0, offsetY = 0) => {
    renderUnit(sp257, unit, mapCoordToScreenX(mapWidth, unit.x) + offsetX, mapCoordToScreenY(unit.y) + offsetY);
  };

  await startAnimation({
    duration: 30 * 10, // 30 ms per frame
    to: 10,
    window: mapWindow,
    onRender: (value) => {
      renderUnitAt(defender);
      renderUnitAt(attacker, value * dx, value * dy);
    },
  });

  await startAnimation({
    duration: 60 * 7, // 60 ms per frame
    to: 7,
    window: mapWindow,
    onRender: (value) => {
      renderTileTerrain(ter257, sp257, gameState.masterMap, loser.x, loser.y, loserScreenX, loserScreenY);
      renderUnitAt(defender);
      renderUnitAt(attacker);
      renderSprite('sp257.pic.gif', value * 16 + 1, 6 * 16 + 1, loserScreenX + 1, loserScreenY + 1, 15, 15);
    },
  });

  excludeUnitInRender = undefined;
  return;
};

export const centerViewport = (x: number, y: number) => {
  const { gameState } = getUiState();
  const newX = x - (mapViewport.width >> 1);
  const newY = y - (mapViewport.height >> 1);
  mapViewport.x = (newX + gameState.masterMap.width) % gameState.masterMap.width;
  mapViewport.y = Math.max(0, Math.min(gameState.masterMap.height - mapViewport.height, newY));
  mapWindow.isDirty = true;
  triggerGameEvent('ViewportChanged');
};

export const ensureSelectedUnitIsInViewport = (unit?: Unit) => {
  const { gameState } = getUiState();
  unit = unit ?? getSelectedUnitForPlayer(gameState, gameState.playerInTurn);

  if (!unit) {
    return;
  }

  const halfWidth = mapViewport.width * 0.5;
  const halfHeight = mapViewport.height * 0.5;

  if (
    Math.abs(unit.x - (mapViewport.x + halfWidth - 0.5)) > halfWidth - 1 ||
    Math.abs(unit.y - (mapViewport.y + halfHeight - 0.5)) > halfHeight - 1
  ) {
    centerViewport(unit.x, unit.y);
  }
};

export const mapWindow: UiWindow = {
  area,
  isDirty: true,
  onRender: (state) => {
    const { localPlayer, gameState } = state;
    const ter257Canvas = getImageAsset('ter257.pic.gif').canvas;
    const sp257 = getImageAsset('sp257.pic.gif');
    const sp257Canvas = sp257.canvas;

    // TODO: don't hardcode local player to index 0
    const player = gameState.players[localPlayer];
    const { map } = player;

    const selectedUnit = getSelectedUnitForPlayer(gameState, localPlayer);
    const selectedUnitX = selectedUnit?.x;
    const selectedUnitY = selectedUnit?.y;
    const excludeSelected = excludeUnitInRender === selectedUnit;
    const shouldHideSelectedStack = state.isBlinking && gameState.playerInTurn === localPlayer;
    const mapWidth = gameState.masterMap.width;

    // TODO: only draw tiles that are actually updated (dirty rect)
    for (let x = mapViewport.x; x < mapViewport.x + mapViewport.width; x++) {
      for (let y = mapViewport.y; y < mapViewport.y + mapViewport.height; y++) {
        const mapX = x % mapWidth;
        const city = getCityAt(gameState, mapX, y);
        const screenX = mapCoordToScreenX(mapWidth, mapX);
        const screenY = mapCoordToScreenY(y);
        const units: Unit[] = getUnitsAt(gameState, mapX, y);

        renderTileTerrain(ter257Canvas, sp257Canvas, map, x, y, screenX, screenY, !!city);

        if (city) {
          renderCity(
            sp257,
            city,
            screenX,
            screenY,
            player.civ.primaryColor,
            player.civ.secondaryColor,
            units.length > 0
          );
        }

        if (!units.length) {
          continue; // No units to render
        }

        let unit: Unit = units[0];

        if (unit === excludeUnitInRender) {
          unit = units[1];
          if (!unit) {
            continue; // Only unit to render was excluded by current animation
          }
        }

        // Special render logic for selected unit stack
        if (mapX === selectedUnitX && y === selectedUnitY) {
          if (shouldHideSelectedStack) {
            continue; // Don't render selected stack if blinking
          }
          if (!excludeSelected && selectedUnit) {
            unit = selectedUnit; // Force selected unit on top of stack unless this is excluded by current animation
          }
        } else if (city) {
          continue; // Don't render units inside cities if not selected stack
        }

        renderUnit(sp257Canvas, unit, screenX, screenY, units.length > 1);
      }
    }
  },
  onClick: (x: number, y: number) => {
    centerViewport(mapViewport.x + (x >> 4), mapViewport.y + (y >> 4));
  },
};

addGameEventListener('GameStateUpdated', () => {
  mapWindow.isDirty = true;
});

addGameEventListener('BlinkingStateUpdated', () => {
  const { gameState, localPlayer } = getUiState();

  if (gameState.playerInTurn === localPlayer && getSelectedUnitForPlayer(gameState, localPlayer) !== undefined) {
    mapWindow.isDirty = true;
  }
});
