import { Action, pushAction } from '../action';
import { isAnimating } from '../animation';
import { fonts } from '../fonts';
import { GameState, getPrototype, getTileAtUnit } from '../game-state';
import { inputMapping, UiInput } from '../input';
import { terrainValueMap } from '../map';
import { palette } from '../palette';
import { renderGrayBox, renderText, renderWindow, renderWorld, setFontColor } from '../renderer';
import { RenderViewport } from '../types';
import { UiScreen } from './ui-controller';

let state: GameState;
let isDirty = true;
let isBlinking = true;

const viewport: RenderViewport = {
  screenX: 320 - 15 * 16,
  screenY: 200 - 12 * 16,
  x: 0,
  y: 0,
  width: 15,
  height: 12,
};

const inputToAction = (input: UiInput): Action | undefined => {
  const player = 0; // for now assume local player is index zero

  switch (input) {
    case UiInput.UnitMoveNorth:
      return { type: 'UnitMove', dx: 0, dy: -1, player };

    case UiInput.UnitMoveNorthEast:
      return { type: 'UnitMove', dx: 1, dy: -1, player };

    case UiInput.UnitMoveEast:
      return { type: 'UnitMove', dx: 1, dy: 0, player };

    case UiInput.UnitMoveSouthEast:
      return { type: 'UnitMove', dx: 1, dy: 1, player };

    case UiInput.UnitMoveSouth:
      return { type: 'UnitMove', dx: 0, dy: 1, player };

    case UiInput.UnitMoveSouthWest:
      return { type: 'UnitMove', dx: -1, dy: 1, player };

    case UiInput.UnitMoveWest:
      return { type: 'UnitMove', dx: -1, dy: 0, player };

    case UiInput.UnitMoveNorthWest:
      return { type: 'UnitMove', dx: -1, dy: -1, player };

    case UiInput.UnitWait:
      return { type: 'UnitWait', player };

    case UiInput.UnitNoOrders:
      return { type: 'UnitNoOrders', player };

    case UiInput.EndTurn:
      if (state.players[player].selectedUnit !== -1) {
        return undefined;
      }
      return { type: 'EndTurn', player };

    default:
      return undefined;
  }
};

export const centerViewport = (x: number, y: number) => {
  const newX = x - (viewport.width >> 1);
  const newY = y - (viewport.height >> 1);
  viewport.x = (newX + state.masterMap.width) % state.masterMap.width;
  viewport.y = Math.max(0, Math.min(state.masterMap.height - viewport.height, newY));
  isDirty = true;
};

export const centerViewportIfNeeded = (x: number, y: number) => {
  const halfWidth = viewport.width * 0.5;
  const halfHeight = viewport.height * 0.5;

  if (
    Math.abs(x - (viewport.x + halfWidth - 0.5)) > halfWidth - 1 ||
    Math.abs(y - (viewport.y + halfHeight - 0.5)) > halfHeight - 1
  ) {
    centerViewport(x, y);
  }
};

const handleInput = (input: UiInput) => {
  if (state.playerInTurn !== 0) {
    return;
  }

  // push to action queue
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
};

export const setWorldUiGameState = (gameState: GameState) => (state = gameState);

export const renderEmprireInfoBox = () => {
  const player = state.players[0];

  renderGrayBox(0, 58, 80, 39);
  renderText(fonts.main, '40,000#', 2, 73); // todo: add turn counter and year calculation
  renderText(fonts.main, '3520 BC', 2, 81); // todo: add turn counter and year calculation
  renderText(fonts.main, `${player.gold}$ 0.5.5`, 2, 89); // todo: add gold and tax rates
};

export const renderUnitInfoBox = (time: number) => {
  renderGrayBox(0, 97, 80, 103);

  const player = state.players[0];
  const selectedUnit = player.units[player.selectedUnit];

  if (selectedUnit) {
    const prototype = getPrototype(selectedUnit);
    const tile = getTileAtUnit(state, selectedUnit);
    const terrain = terrainValueMap[tile.terrain];
    renderText(fonts.main, 'German', 3, 99); // todo: add civ names
    renderText(fonts.main, prototype.name, 3, 107);
    renderText(fonts.main, `Moves: ${selectedUnit.movesLeft / 3}`, 3, 115);
    renderText(fonts.main, 'Berlin', 3, 123); // todo add upkeep city
    renderText(fonts.main, `(${terrain.name})`, 3, 131);
    return;
  }

  isBlinking && renderText(fonts.main, 'End of Turn', 3, 125);
  renderText(fonts.main, 'Press Enter', 3, 138);
  renderText(fonts.main, 'to continue', 3, 146);
};

export const uiWorldView: UiScreen = {
  isDirty: (time: number) => {
    const newBlinkingState = Math.floor(time * 0.007) % 2 === 0;
    if (isBlinking === newBlinkingState) {
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
    renderEmprireInfoBox();
    renderUnitInfoBox(time);
    isDirty = false;
  },
  onKey: (keyCode: string) => {
    if (!state) {
      return;
    }

    const input = inputMapping[keyCode];
    if (input) {
      handleInput(input);
    }
  },
  onClick: (x: number, y: number) => {
    const relX = x - viewport.screenX;
    const relY = y - viewport.screenY;

    centerViewport(viewport.x + (relX >> 4), viewport.y + (relY >> 4));
  },
};
