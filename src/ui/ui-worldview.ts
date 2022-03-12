import { isAnimating, startAnimation } from '../animation';
import { fonts } from '../fonts';
import { GameState, getPrototype, getSelectedUnitForPlayer, getTileAtUnit } from '../logic/game-state';
import { inputMappingWorldView } from '../input-mapping';
import { terrainValueMap } from '../logic/map';
import { palette } from '../palette';
import {
  mapCoordToScreenX,
  mapCoordToScreenY,
  renderGrayBox,
  renderSprite,
  renderText,
  renderTextLines,
  renderTile,
  renderUnit,
  renderWindow,
  renderWorld,
  setFontColor,
} from '../renderer';
import { MapRenderViewport } from '../types';
import { UiScreen } from './ui-controller';
import { pushUiEvent } from './ui-event-queue';
import { MoveUnitResult } from '../logic/civ-game';
import { turnToYear } from '../logic/formulas';
import { Unit } from '../logic/units';
import { getImageAsset } from '../assets';

let state: GameState;
let isDirty = true;
let isBlinking = true;
const localPlayer = 0;
let excludeUnitInRender: Unit | undefined;

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
    const terrain = terrainValueMap[tile.terrain];

    renderTextLines(
      fonts.main,
      [
        player.civ.name,
        prototype.name,
        selectedUnit.isVeteran ? ' Veteran' : undefined,
        `Moves: ${selectedUnit.movesLeft / 3}`,
        'Berlin',
        `(${terrain.name})`,
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

export const animateUnitMoved = async (moveResult: MoveUnitResult) => {
  const ter257 = getImageAsset('ter257.pic.gif').canvas;
  const sp257 = getImageAsset('sp257.pic.gif').canvas;

  switch (moveResult.outcome) {
    case 'UnitMoved': {
      const { dx, dy, unit } = moveResult;

      excludeUnitInRender = unit;
      await startAnimation({
        duration: 20 * 16, // 20 ms per frame
        to: 16,
        onUpdate: (value) => {
          isDirty = true;
        },
        onRender: (value) => {
          renderUnit(state, viewport, unit, sp257, -dx * (16 - value), -dy * (16 - value));
        },
      });
      excludeUnitInRender = undefined;

      return;
    }

    case 'UnitMoveDenied':
      // do nothing
      return;

    case 'Combat': {
      const { dx, dy } = moveResult;

      const mapWidth = state.masterMap.width;
      const loser = moveResult.winner === 'Attacker' ? moveResult.defender : moveResult.attacker;
      const winner = moveResult.winner === 'Attacker' ? moveResult.attacker : moveResult.defender;
      const loserScreenX = mapCoordToScreenX(mapWidth, viewport, loser.x);
      const loserScreenY = mapCoordToScreenY(viewport, loser.y);

      excludeUnitInRender = winner;
      await startAnimation({
        duration: 30 * 10, // 30 ms per frame
        to: 10,
        onUpdate: (value) => {
          isDirty = true;
        },
        onRender: (value) => {
          renderUnit(state, viewport, moveResult.defender, sp257);
          renderUnit(state, viewport, moveResult.attacker, sp257, dx * value, dy * value);
        },
      });

      await startAnimation({
        duration: 60 * 7,
        to: 7,
        onUpdate: (value) => {
          isDirty = true;
        },
        onRender: (value) => {
          renderTile(state.masterMap, viewport, loser.x, loser.y, ter257, sp257);
          renderUnit(state, viewport, winner, sp257);
          renderUnit(state, viewport, loser, sp257);
          renderSprite('sp257.pic.gif', value * 16 + 1, 6 * 16 + 1, loserScreenX + 1, loserScreenY + 1, 15, 15);
        },
      });

      excludeUnitInRender = undefined;

      /*await startAnimation(
        (frame) => {
          isDirty = true;
          renderUnit(state, viewport, loser, sp257);

          if (frame > 11) {
            moveResult.attacker.screenOffsetX = 0;
            moveResult.attacker.screenOffsetY = 0;
            return true;
          }

          moveResult.attacker.screenOffsetX = dx * frame;
          moveResult.attacker.screenOffsetY = dy * frame;
          return false;
        },
        33.333,
        'postRender'
      ); // 10 frames travel in 300 ms = 30 ms/frame = 33 fps

      await startAnimation(
        (frame) => {
          renderTile(state.masterMap, viewport, loser.x, loser.y, ter257, sp257);
          renderUnit(state, viewport, loser, sp257);
          renderSprite('sp257.pic.gif', frame * 16 + 1, 6 * 16 + 1, loserScreenX + 1, loserScreenY + 1, 15, 15);
          return frame > 6;
        },
        16.667, // 8 frames of animation in 480 ms 60 ms/frame = 16.667 fps
        'postRender'
      );*/

      return;
    }
  }
};

export const uiWorldView: UiScreen = {
  isDirty: (time: number) => {
    if (isDirty) {
      return true;
    }

    if (isAnimating() || state.playerInTurn !== localPlayer) {
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
  onRender: (time: number) => {
    // World view
    renderWorld(state, viewport, excludeUnitInRender);

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
