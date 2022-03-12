import { GameState, getPlayerInTurn, getSelectedUnitForPlayer, PlayerController } from './logic/game-state';
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
import { executeAction, newGame } from './logic/civ-game';
import { loadJson } from './assets';
import { americans, egyptians } from './logic/civilizations';
import { popUiEvent, UiEvent } from './ui/ui-event-queue';
import { unitMoveDirection } from './input-mapping';
import { aiTick } from './logic/ai';
import { Action } from './logic/action';

let state: GameState;
const localPlayer = 0; // todo don't use hardcoded index for local player

export const startGame = async () => {
  const newMap = await loadJson<MapTemplate>('/assets/earth.json');

  state = newGame(newMap, [americans, egyptians]);
  state.players[localPlayer].controller = PlayerController.LocalHuman;

  // Initialize ui
  generateSpriteSheets(state.players.map((pl) => pl.civ));
  clearUi();
  setWorldUiGameState(state);
  pushUiScreen(uiWorldView);

  const selectedUnit = getSelectedUnitForPlayer(state, localPlayer);
  if (selectedUnit) {
    centerViewport(selectedUnit.x, selectedUnit.y);
  }
};

const handleAction = async (action: Action | undefined): Promise<void> => {
  if (!action) {
    return;
  }

  const result = executeAction(state, action);
  ensureSelectedUnitIsInViewport();

  if (result) {
    await animateUnitMoved(result);
  }
};

const uiEventToAction = (event: UiEvent | undefined): Action | undefined => {
  // for now ignore events out of turn. There might exist exceptions in the future (like granting audience)
  if (!event || state.playerInTurn !== localPlayer) {
    return;
  }

  const player = state.players[localPlayer];
  const selectedUnitIdx = player.selectedUnit;
  const selectedUnit = getSelectedUnitForPlayer(state, localPlayer);

  switch (event) {
    case UiEvent.UnitMoveNorth:
    case UiEvent.UnitMoveNorthEast:
    case UiEvent.UnitMoveEast:
    case UiEvent.UnitMoveSouthEast:
    case UiEvent.UnitMoveSouth:
    case UiEvent.UnitMoveSouthWest:
    case UiEvent.UnitMoveWest:
    case UiEvent.UnitMoveNorthWest: {
      if (selectedUnitIdx === undefined) {
        return;
      }
      ensureSelectedUnitIsInViewport();
      const [dx, dy] = unitMoveDirection[event];
      return { type: 'UnitMove', dx, dy, player: localPlayer, unit: selectedUnitIdx };
    }

    case UiEvent.UnitWait:
      if (selectedUnitIdx === undefined) {
        return;
      }
      return { type: 'UnitWait', player: localPlayer, unit: selectedUnitIdx };

    case UiEvent.UnitNoOrders:
      if (selectedUnitIdx === undefined) {
        return;
      }
      return { type: 'UnitNoOrders', player: localPlayer, unit: selectedUnitIdx };

    case UiEvent.EndTurn:
      return { type: 'EndTurn', player: localPlayer };

    case UiEvent.UnitCenter:
      if (!selectedUnit) {
        return;
      }
      centerViewport(selectedUnit.x, selectedUnit.y);
      return;

    default:
      return;
  }
};

const logicFrame = () => {
  if (!state) {
    requestAnimationFrame(logicFrame);
    return;
  }

  const playerInTurn = getPlayerInTurn(state);
  let action: Action | undefined = undefined;

  switch (playerInTurn.controller) {
    case PlayerController.LocalHuman: {
      const event = popUiEvent();
      action = uiEventToAction(event);
      break;
    }

    case PlayerController.Computer: {
      action = aiTick(state);
      break;
    }
  }

  handleAction(action).then(
    () => requestAnimationFrame(logicFrame),
    (err) => {
      console.error(`Failed to process action ${action?.type}: ${err as string}`);
      requestAnimationFrame(logicFrame);
    }
  );
};
requestAnimationFrame(logicFrame);
