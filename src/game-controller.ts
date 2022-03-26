import { GameState, getPlayerInTurn, getSelectedUnitForPlayer, PlayerController } from './logic/game-state';
import { MapTemplate } from './logic/map';
import { generateSpriteSheets } from './renderer';
import { clearUi, pushUiScreen } from './ui/ui-controller';
import { uiWorldScreen } from './ui/ui-screens';
import { loadJson } from './assets';
import { americans, egyptians } from './logic/civilizations';
import { popUiAction } from './ui/ui-action-queue';
import { aiTick } from './logic/ai';
import { Action } from './logic/action';
import { initUi, updateUiState } from './ui/ui-state';
import { triggerGameEvent } from './game-event';
import { animateCombat, animateUnitMoved, centerViewport, ensureSelectedUnitIsInViewport } from './ui/ui-worldview-map';
import { calculateCitizens, newCity } from './logic/city';
import { executeAction, newGame } from './logic/game-rules/civ-game';

let state: GameState;
const localPlayer = 0; // todo don't use hardcoded index for local player

export const startGame = async () => {
  const earthTemplate = await loadJson<MapTemplate>('/assets/earth.json');

  state = newGame(earthTemplate, [americans, egyptians]);
  state.players[localPlayer].controller = PlayerController.LocalHuman;

  // Initialize ui
  generateSpriteSheets(state.players.map((pl) => pl.civ));
  clearUi();
  initUi(state, localPlayer);
  pushUiScreen(uiWorldScreen);
  triggerGameEvent('GameStateUpdated');

  const city = newCity(0, 'Issus', 10, 15);
  city.size = 10;
  city.workedTiles = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  state.players[localPlayer].cities.push(city);
  calculateCitizens(state.players[localPlayer].map, city);

  /*  updateUiState('selectedCity', city);
  pushUiScreen(uiCityScreen);*/

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
      action = popUiAction();
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
