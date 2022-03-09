import { GameState, getSelectedUnitForPlayer } from './logic/game-state';
import { MapTemplate } from './logic/map';
import { generateSpriteSheets } from './renderer';
import { clearUi, pushUiScreen } from './ui/ui-controller';
import {
  animateUnitMoved,
  centerViewport,
  ensureSelectedUnitIsInViewport,
  setWorldUiGameState,
  uiWorldView,
} from './ui/ui-worldview';
import { handleEndTurn, handleMoveUnit, handleUnitNoOrder, handleUnitWait, newGame } from './logic/civ-game';
import { loadJson } from './assets';
import { americans, egyptians } from './logic/civilizations';
import { popUiEvent, UiEvent } from './ui/ui-event-queue';

let state: GameState;
const localPlayer = 0; // todo don't use hardcoded index for local player

export const startGame = async () => {
  const newMap = await loadJson<MapTemplate>('/assets/earth.json');

  state = newGame(newMap, [americans, egyptians]);

  generateSpriteSheets(state.players.map((pl) => pl.civ));

  // Initialize ui
  clearUi();
  setWorldUiGameState(state);
  pushUiScreen(uiWorldView);

  const selectedUnit = getSelectedUnitForPlayer(state, localPlayer);
  centerViewport(selectedUnit.x, selectedUnit.y);
};

// eslint-disable-next-line @typescript-eslint/require-await
const handleMoveEvent = async (dx: number, dy: number): Promise<void> => {
  ensureSelectedUnitIsInViewport();

  const player = state.players[localPlayer];
  const unit = player.units[player.selectedUnit];

  const result = handleMoveUnit(state, { type: 'UnitMove', dx, dy, player: localPlayer, unit: player.selectedUnit });

  await animateUnitMoved(dx, dy, result);

  ensureSelectedUnitIsInViewport();
};

const handleEvent = async (event: UiEvent): Promise<void> => {
  const unit = state.players[localPlayer].selectedUnit;

  switch (event) {
    case UiEvent.UnitMoveNorth:
      return handleMoveEvent(0, -1);

    case UiEvent.UnitMoveNorthEast:
      return handleMoveEvent(1, -1);

    case UiEvent.UnitMoveEast:
      return handleMoveEvent(1, 0);

    case UiEvent.UnitMoveSouthEast:
      return handleMoveEvent(1, 1);

    case UiEvent.UnitMoveSouth:
      return handleMoveEvent(0, 1);

    case UiEvent.UnitMoveSouthWest:
      return handleMoveEvent(-1, 1);

    case UiEvent.UnitMoveWest:
      return handleMoveEvent(-1, 0);

    case UiEvent.UnitMoveNorthWest:
      return handleMoveEvent(-1, -1);

    case UiEvent.UnitWait:
      handleUnitWait(state, { player: localPlayer, unit });
      ensureSelectedUnitIsInViewport();
      return;

    case UiEvent.UnitNoOrders:
      handleUnitNoOrder(state, { player: localPlayer, unit });
      ensureSelectedUnitIsInViewport();
      return;

    case UiEvent.EndTurn:
      handleEndTurn(state, { player: localPlayer });
      return;

    case UiEvent.UnitCenter: {
      const selectedUnit = getSelectedUnitForPlayer(state, localPlayer);
      centerViewport(selectedUnit.x, selectedUnit.y);
      return;
    }
  }
};

const logicFrame = () => {
  const event = popUiEvent();

  if (!event) {
    requestAnimationFrame(logicFrame);
    return;
  }

  handleEvent(event).then(
    () => requestAnimationFrame(logicFrame),
    (err) => {
      console.error(`Failed to process action ${event}: ${err as string}`);
      requestAnimationFrame(logicFrame);
    }
  );
};
requestAnimationFrame(logicFrame);
