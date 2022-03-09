import { animate, isAnimating } from '../animation';
import { fonts } from '../fonts';
import { GameState, getPrototype, getSelectedUnitForPlayer, getTileAtUnit } from '../logic/game-state';
import { inputMappingWorldView } from '../input';
import { terrainValueMap } from '../logic/map';
import { palette } from '../palette';
import { renderGrayBox, renderSprite, renderText, renderWindow, renderWorld, setFontColor } from '../renderer';
import { RenderViewport } from '../types';
import { UiScreen } from './ui-controller';
import { pushUiEvent } from './ui-event-queue';
import { MoveUnitResult } from '../logic/civ-game';

let state: GameState;
let isDirty = true;
let isBlinking = true;
const localPlayer = 0;

const viewport: RenderViewport = {
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

export const ensureSelectedUnitIsInViewport = () => {
  const unit = getSelectedUnitForPlayer(state, localPlayer);

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

/*const handleInput = (input: UiInput) => {
  if (state.playerInTurn !== 0) {
    return;
  }

  // push input event to action queue

  const action = inputToAction(input);
  if (action) {
    console.log('action pushed');
    pushAction(action);
    return;
  }

  if (isAnimating()) {
    return;
  }

  switch (input) {
    case UiInput.UnitCenter: {
      const player = state.players[state.playerInTurn];
      if (player.selectedUnit === -1) {
        return;
      }

      const unit = player.units[player.selectedUnit];
      return centerViewport(unit.x, unit.y);
    }
  }
};*/

export const setWorldUiGameState = (gameState: GameState) => (state = gameState);

export const renderEmpireInfoBox = () => {
  const player = state.players[localPlayer];

  renderGrayBox(0, 58, 80, 39);
  renderText(fonts.main, '40,000#', 2, 73); // todo: add turn counter and year calculation
  const textOffset = renderText(fonts.main, '3520 BC', 2, 81); // todo: add turn counter and year calculation
  renderSprite('sp299.pic.png', 20 * 8, 15 * 8, textOffset + 2, 80, 8, 8);
  renderText(fonts.main, `${player.gold}$ 0.5.5`, 2, 89); // todo: add gold and tax rates
};

export const renderUnitInfoBox = () => {
  renderGrayBox(0, 97, 80, 103);

  const player = state.players[localPlayer];
  const selectedUnit = player.units[player.selectedUnit];

  if (selectedUnit) {
    const prototype = getPrototype(selectedUnit);
    const tile = getTileAtUnit(state, selectedUnit);
    const terrain = terrainValueMap[tile.terrain];
    renderText(fonts.main, player.civ.name, 3, 99);
    renderText(fonts.main, prototype.name, 3, 107);
    renderText(fonts.main, `Moves: ${selectedUnit.movesLeft / 3}`, 3, 115);
    renderText(fonts.main, 'Berlin', 3, 123); // todo add upkeep city
    renderText(fonts.main, `(${terrain.name})`, 3, 131);
    return;
  }

  if (!isAnimating()) {
    isBlinking && renderText(fonts.main, 'End of Turn', 3, 125);
    renderText(fonts.main, 'Press Enter', 3, 138);
    renderText(fonts.main, 'to continue', 3, 146);
  }
};

export const animateUnitMoved = async (dx: number, dy: number, moveResult: MoveUnitResult) => {
  switch (moveResult.outcome) {
    case 'UnitMoved': {
      moveResult.unit.screenOffsetX = -dx * 16;
      moveResult.unit.screenOffsetY = -dy * 16;
      let lastProgress;
      await animate((time) => {
        const progress = Math.floor(time * 0.08);
        if (progress !== lastProgress) {
          isDirty = true;
          moveResult.unit.screenOffsetX = -dx * (16 - progress);
          moveResult.unit.screenOffsetY = -dy * (16 - progress);
        }
        lastProgress = progress;
        return progress > 15;
      });
      moveResult.unit.screenOffsetX = 0;
      moveResult.unit.screenOffsetY = 0;
      return;
    }

    case 'UnitMoveDenied':
      // do nothing
      return;

    case 'Combat':
      // animate combar
      return;
  }
};

export const uiWorldView: UiScreen = {
  isDirty: (time: number) => {
    if (isDirty) {
      return true;
    }

    const newBlinkingState = Math.floor(time * 0.007) % 2 === 0;
    if (isBlinking === newBlinkingState || isAnimating()) {
      return false;
    }

    isBlinking = newBlinkingState;
    return true;
  },
  onRender: (time: number) => {
    console.log('render');
    // World view
    renderWorld(state, viewport, isAnimating() || isBlinking);

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
