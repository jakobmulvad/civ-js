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
import { americans } from './logic/civilizations';
import { popUiEvent, UiEvent } from './ui/ui-event-queue';
import { unitMoveDirection } from './input-mapping';

let state: GameState;
const localPlayer = 0; // todo don't use hardcoded index for local player

export const startGame = async () => {
  const newMap = await loadJson<MapTemplate>('/assets/earth.json');

  state = newGame(newMap, [americans]);

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
  // for now ignore events out of turn. There might exist exceptions in the future (like granting audience)
  if (state.playerInTurn !== localPlayer) {
    return;
  }

  const player = state.players[localPlayer];
  const selectedUnitIdx = player.selectedUnit;
  const selectedUnit = player.units[selectedUnitIdx];

  switch (event) {
    case UiEvent.UnitMoveNorth:
    case UiEvent.UnitMoveNorthEast:
    case UiEvent.UnitMoveEast:
    case UiEvent.UnitMoveSouthEast:
    case UiEvent.UnitMoveSouth:
    case UiEvent.UnitMoveSouthWest:
    case UiEvent.UnitMoveWest:
    case UiEvent.UnitMoveNorthWest: {
      if (!selectedUnit) {
        return;
      }
      const [dx, dy] = unitMoveDirection[event];
      return handleMoveEvent(dx, dy);
    }

    case UiEvent.UnitWait:
      if (!selectedUnit) {
        return;
      }
      handleUnitWait(state, { player: localPlayer, unit: selectedUnitIdx });
      ensureSelectedUnitIsInViewport();
      return;

    case UiEvent.UnitNoOrders:
      if (!selectedUnit) {
        return;
      }
      handleUnitNoOrder(state, { player: localPlayer, unit: selectedUnitIdx });
      ensureSelectedUnitIsInViewport();
      return;

    case UiEvent.EndTurn:
      handleEndTurn(state, { player: localPlayer });
      return;

    case UiEvent.UnitCenter:
      if (!selectedUnit) {
        return;
      }
      centerViewport(selectedUnit.x, selectedUnit.y);
      return;
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
