import {
  GameState,
  getPlayerInTurn,
  getPrototype,
  getSelectedUnitForPlayer,
  PlayerController,
} from './logic/game-state';
import { getTerrainAt, MapTemplate } from './logic/map';
import { generateSpriteSheets } from './renderer';
import { clearUi, pushUiScreen } from './ui/ui-controller';
import { uiWorldView } from './ui/ui-worldview';
import { executeAction, newGame } from './logic/civ-game';
import { loadJson } from './assets';
import { americans, egyptians } from './logic/civilizations';
import { popUiEvent, UiEvent } from './ui/ui-event-queue';
import { unitMoveDirection } from './input-mapping';
import { aiTick } from './logic/ai';
import { Action } from './logic/action';
import { initUi, updateUiState } from './ui/ui-state';
import { triggerGameEvent } from './game-event';
import { animateCombat, animateUnitMoved, centerViewport, ensureSelectedUnitIsInViewport } from './ui/ui-worldview-map';

let state: GameState;
const localPlayer = 0; // todo don't use hardcoded index for local player

export const startGame = async () => {
  const newMap = await loadJson<MapTemplate>('/assets/earth.json');

  state = newGame(newMap, [americans, egyptians]);
  state.players[localPlayer].controller = PlayerController.LocalHuman;

  // Initialize ui
  generateSpriteSheets(state.players.map((pl) => pl.civ));
  clearUi();
  initUi(state, localPlayer);
  pushUiScreen(uiWorldView);
  triggerGameEvent('GameStateUpdated');

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
  triggerGameEvent('GameStateUpdated');
  ensureSelectedUnitIsInViewport();

  if (!result) {
    return;
  }

  switch (result.type) {
    case 'UnitMoved':
      await animateUnitMoved(result);
      return;

    case 'Combat':
      await animateCombat(result);
      return;

    case 'ActionFailed':
      // TODO: handle failed actions
      console.log('Action failed:', result.reason);
      return;
  }
};

const uiEventToAction = (event: UiEvent | undefined): Action | undefined => {
  // for now ignore events out of turn. There might exist exceptions in the future (like granting audience)
  if (!event || state.playerInTurn !== localPlayer) {
    return;
  }

  console.log('UiEvent:', event);

  if (event === UiEvent.EndTurn) {
    return { type: 'EndTurn', player: localPlayer };
  }

  const player = state.players[localPlayer];
  const selectedUnitIdx = player.selectedUnit;
  const selectedUnit = getSelectedUnitForPlayer(state, localPlayer);

  if (!selectedUnit || selectedUnitIdx === undefined) {
    return;
  }

  switch (event) {
    case UiEvent.UnitMoveNorth:
    case UiEvent.UnitMoveNorthEast:
    case UiEvent.UnitMoveEast:
    case UiEvent.UnitMoveSouthEast:
    case UiEvent.UnitMoveSouth:
    case UiEvent.UnitMoveSouthWest:
    case UiEvent.UnitMoveWest:
    case UiEvent.UnitMoveNorthWest: {
      ensureSelectedUnitIsInViewport();
      const [dx, dy] = unitMoveDirection[event];
      return { type: 'UnitMove', dx, dy, player: localPlayer, unit: selectedUnitIdx };
    }

    case UiEvent.UnitWait:
      return { type: 'UnitWait', player: localPlayer, unit: selectedUnitIdx };

    case UiEvent.UnitNoOrders:
      return { type: 'UnitNoOrders', player: localPlayer, unit: selectedUnitIdx };

    case UiEvent.UnitFortifyOrBuildFortress:
      return { type: 'UnitFortify', player: localPlayer, unit: selectedUnitIdx };

    case UiEvent.UnitBuildIrrigationOrClear: {
      const terrain = getTerrainAt(state.masterMap, selectedUnit.x, selectedUnit.y);
      if (terrain.canIrrigate) {
        return { type: 'UnitBuildIrrigation', player: localPlayer, unit: selectedUnitIdx };
      }
      if (terrain.clearsTo !== undefined) {
        return { type: 'UnitClear', player: localPlayer, unit: selectedUnitIdx };
      }
      return;
    }

    case UiEvent.UnitBuildMine:
      return { type: 'UnitBuildMine', player: localPlayer, unit: selectedUnitIdx };

    case UiEvent.UnitBuildRoad:
      return { type: 'UnitBuildRoad', player: localPlayer, unit: selectedUnitIdx };

    case UiEvent.UnitBuildOrJoinCity:
      if (!getPrototype(selectedUnit).isBuilder) {
        return;
      }
      return { type: 'UnitBuildOrJoinCity', player: localPlayer, unit: selectedUnitIdx };

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

const logicFrame = (time: number) => {
  if (!state) {
    requestAnimationFrame(logicFrame);
    return;
  }

  if (updateUiState('isBlinking', Math.floor(time * 0.00667) % 2 === 0)) {
    triggerGameEvent('BlinkingStateUpdated');
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

    case PlayerController.Remote:
      // TODO: implement
      throw new Error('Remote player not implemented');
  }

  handleAction(action).then(
    () => requestAnimationFrame(logicFrame),
    (err) => {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      console.error(`Failed to process action ${action?.type}: ${err as string}`);
      requestAnimationFrame(logicFrame);
    }
  );
};
requestAnimationFrame(logicFrame);
