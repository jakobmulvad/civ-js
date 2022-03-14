import { isAnimating, startAnimation } from '../animation';
import { fonts } from '../fonts';
import { GameState, getPrototype, getSelectedUnitForPlayer, getTileAtUnit, getUnitsAt } from '../logic/game-state';
import { inputMappingWorldView } from '../input-mapping';
import { terrainMap } from '../logic/map';
import { palette } from '../palette';
import {
  renderGrayBox,
  renderSprite,
  renderText,
  renderTextLines,
  renderTileTerrain,
  renderUnit,
  renderWindow,
  setFontColor,
} from '../renderer';
import { UiScreen } from './ui-controller';
import { pushUiEvent } from './ui-event-queue';
import { turnToYear } from '../logic/formulas';
import { Unit } from '../logic/units';
import { getImageAsset } from '../assets';
import { UnitCombatResult, UnitMoveResult } from '../logic/civ-game';

let state: GameState;
let isDirty = true;
let isBlinking = true;
const localPlayer = 0;
let excludeUnitInRender: Unit | undefined;

export type MapRenderViewport = {
  screenX: number;
  screenY: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

const viewport: MapRenderViewport = {
  screenX: 320 - 15 * 16,
  screenY: 200 - 12 * 16,
  x: 0,
  y: 0,
  width: 15,
  height: 12,
};

export const centerViewport = (x: number, y: number) => {
  const newX = x - (viewport.width >> 1);
  const newY = y - (viewport.height >> 1);
  viewport.x = (newX + state.masterMap.width) % state.masterMap.width;
  viewport.y = Math.max(0, Math.min(state.masterMap.height - viewport.height, newY));
  isDirty = true;
};

export const ensureSelectedUnitIsInViewport = (unit?: Unit) => {
  unit = unit ?? getSelectedUnitForPlayer(state, state.playerInTurn);

  if (!unit) {
    return;
  }

  const halfWidth = viewport.width * 0.5;
  const halfHeight = viewport.height * 0.5;

  if (
    Math.abs(unit.x - (viewport.x + halfWidth - 0.5)) > halfWidth - 1 ||
    Math.abs(unit.y - (viewport.y + halfHeight - 0.5)) > halfHeight - 1
  ) {
    centerViewport(unit.x, unit.y);
  }
};

export const setWorldUiGameState = (gameState: GameState) => (state = gameState);

export const renderEmpireInfoBox = () => {
  const player = state.players[localPlayer];

  renderGrayBox(0, 58, 80, 39);
  renderText(fonts.main, '40,000#', 2, 73); // todo: add turn counter and year calculation
  const textOffset = renderText(fonts.main, turnToYear(state.turn), 2, 81); // todo: add turn counter and year calculation
  renderSprite('sp299.pic.png', 20 * 8, 15 * 8, textOffset + 2, 80, 8, 8);
  renderText(fonts.main, `${player.gold}$ 0.5.5`, 2, 89); // todo: add gold and tax rates
};

const mapCoordToScreenX = (x: number): number => {
  const mapWidth = state.masterMap.width;
  return viewport.screenX + Math.max(x - viewport.x, (x - viewport.x + mapWidth) % mapWidth) * 16;
};

const mapCoordToScreenY = (y: number): number => {
  return viewport.screenY + (y - viewport.y) * 16;
};

export const renderUnitInfoBox = () => {
  renderGrayBox(0, 97, 80, 103);

  if (state.playerInTurn !== localPlayer) {
    return;
  }

  const player = state.players[localPlayer];
  const selectedUnit = getSelectedUnitForPlayer(state, localPlayer);

  if (selectedUnit) {
    const prototype = getPrototype(selectedUnit);
    const tile = getTileAtUnit(state, selectedUnit);
    const terrain = terrainMap[tile.terrain];

    renderTextLines(
      fonts.main,
      [
        player.civ.name,
        prototype.name,
        selectedUnit.isVeteran ? ' Veteran' : undefined,
        `Moves: ${selectedUnit.movesLeft / 3}`,
        'Berlin',
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

  if (!isAnimating()) {
    isBlinking && renderText(fonts.main, 'End of Turn', 3, 125);
    renderText(fonts.main, 'Press Enter', 3, 138);
    renderText(fonts.main, 'to continue', 3, 146);
  }
};

export const animateUnitMoved = async (result: UnitMoveResult) => {
  const sp257 = getImageAsset('sp257.pic.gif').canvas;
  isBlinking = false;

  const { dx, dy, unit } = result;

  const screenX = mapCoordToScreenX(unit.x);
  const screenY = mapCoordToScreenY(unit.y);

  excludeUnitInRender = unit;
  await startAnimation({
    duration: 15 * 16, // 15 ms per frame
    to: 16,
    onUpdate: () => {
      isDirty = true;
    },
    onRender: (value) => {
      renderUnit(sp257, unit, screenX - (16 - value) * dx, screenY - (16 - value) * dy);
    },
  });
  excludeUnitInRender = undefined;
};

export const animateCombat = async (result: UnitCombatResult) => {
  const ter257 = getImageAsset('ter257.pic.gif').canvas;
  const sp257 = getImageAsset('sp257.pic.gif').canvas;
  const { dx, dy, attacker, defender } = result;

  const loser = result.winner === 'Attacker' ? defender : attacker;
  const winner = result.winner === 'Attacker' ? attacker : defender;
  const loserScreenX = mapCoordToScreenX(loser.x);
  const loserScreenY = mapCoordToScreenY(loser.y);

  excludeUnitInRender = winner;

  const renderUnitAt = (unit: Unit, offsetX = 0, offsetY = 0) => {
    renderUnit(sp257, unit, mapCoordToScreenX(unit.x) + offsetX, mapCoordToScreenY(unit.y) + offsetY);
  };

  await startAnimation({
    duration: 30 * 10, // 30 ms per frame
    to: 10,
    onUpdate: () => {
      isDirty = true;
    },
    onRender: (value) => {
      renderUnitAt(defender);
      renderUnitAt(attacker, value * dx, value * dy);
    },
  });

  await startAnimation({
    duration: 60 * 7, // 60 ms per frame
    to: 7,
    onUpdate: () => {
      isDirty = true;
    },
    onRender: (value) => {
      renderTileTerrain(ter257, sp257, state.masterMap, loser.x, loser.y, loserScreenX, loserScreenY);
      renderUnitAt(defender);
      renderUnitAt(attacker);
      renderSprite('sp257.pic.gif', value * 16 + 1, 6 * 16 + 1, loserScreenX + 1, loserScreenY + 1, 15, 15);
    },
  });

  excludeUnitInRender = undefined;
  return;
};

const renderWorld = () => {
  const ter257 = getImageAsset('ter257.pic.gif').canvas;
  const sp257 = getImageAsset('sp257.pic.gif').canvas;

  // TODO: don't hardcode local player to index 0
  const player = state.players[0];
  const { map } = player;

  const selectedUnit = getSelectedUnitForPlayer(state, localPlayer);
  const excludeSelected = excludeUnitInRender === selectedUnit;
  const shouldHideSelectedStack = !!selectedUnit && isBlinking && state.playerInTurn === localPlayer;
  const mapWidth = state.masterMap.width;

  // TODO: only draw tiles that are actually updated (dirty rect)
  for (let x = viewport.x; x < viewport.x + viewport.width; x++) {
    for (let y = viewport.y; y < viewport.y + viewport.height; y++) {
      const mapX = (x + mapWidth) % mapWidth;
      const screenX = mapCoordToScreenX(mapX);
      const screenY = mapCoordToScreenY(y);
      const units: Unit[] = getUnitsAt(state, mapX, y, excludeUnitInRender);

      renderTileTerrain(ter257, sp257, map, x, y, screenX, screenY);

      if (!units.length) {
        continue; // skip unit rendering
      }

      let unit: Unit = units[0];
      if (unit.owner === localPlayer && selectedUnit && selectedUnit.x === mapX && selectedUnit.y === y) {
        // This is the currently selected stack. Check if we should blink it or just show selected unit at top.
        if (shouldHideSelectedStack) {
          continue; // don't render unit stack if we are blinking
        } else if (!excludeSelected) {
          unit = selectedUnit; // force selected unit on top of stack
        }
      }

      renderUnit(sp257, unit, screenX, screenY, units.length > 1);
    }
  }
};

export const uiWorldView: UiScreen = {
  isDirty: (time: number) => {
    if (isDirty) {
      return true;
    }

    if (isAnimating() || state.playerInTurn !== localPlayer) {
      isBlinking = false;
      return false;
    }

    const newBlinkingState = Math.floor(time * 0.00667) % 2 === 0; //150 ms per blink
    if (isBlinking === newBlinkingState) {
      return false;
    }

    isBlinking = newBlinkingState;
    excludeUnitInRender = isBlinking ? getSelectedUnitForPlayer(state, localPlayer) : undefined;
    return true;
  },
  onRender: () => {
    // World view
    renderWorld();

    // Left info bar
    setFontColor(fonts.main, palette.black);
    renderWindow(0, 8, 80, 50, palette.black);
    renderEmpireInfoBox();
    renderUnitInfoBox();
    isDirty = false;
  },
  onKey: (keyCode: string) => {
    if (!state) {
      return;
    }

    const event = inputMappingWorldView[keyCode];
    if (event) {
      pushUiEvent(event);
    }
  },
  onClick: (x: number, y: number) => {
    const relX = x - viewport.screenX;
    const relY = y - viewport.screenY;

    centerViewport(viewport.x + (relX >> 4), viewport.y + (relY >> 4));
  },
};
