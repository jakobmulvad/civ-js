import { GameState, getPlayerInTurn, getSelectedUnitForPlayer, PlayerController } from './logic/game-state';
import { MapTemplate } from './logic/map';
import { generateSpriteSheets } from './renderer';
import { clearUi, pushUiScreen } from './ui/ui-controller';
import { uiCityScreen, uiWorldScreen } from './ui/ui-screens';
import { loadJson } from './assets';
import { americans } from './logic/civilizations';
import { popUiAction } from './ui/ui-action-queue';
import { aiTick } from './logic/ai';
import { Action } from './logic/action';
import { initUi, updateUiState } from './ui/ui-state';
import { triggerGameEvent } from './game-event';
import { animateCombat, animateUnitMoved, centerViewport, ensureSelectedUnitIsInViewport } from './ui/ui-worldview-map';
import { executeAction, newGame } from './logic/game-rules/civ-game';
import { generateMapTemplate, Temperature } from './logic/map-generation';

let state: GameState;
const localPlayer = 0; // todo don't use hardcoded index for local player

export const startGame = async () => {
  const earthTemplate = await loadJson<MapTemplate>('/assets/earth.json');

  state = newGame(
    generateMapTemplate({
      temperature: Temperature.Cool,
    }),
    [americans]
  );
  state.players[localPlayer].controller = PlayerController.LocalHuman;

  // Initialize ui
  generateSpriteSheets(state.players.map((pl) => pl.civ));
  clearUi();
  initUi(state, localPlayer);
  pushUiScreen(uiWorldScreen);
  triggerGameEvent('GameStateUpdated');

  /*const city = newCity(0, 'Issus', 10, 15);
  city.size = 20;
  city.food = 30;
  city.shields = 10;
  city.workedTiles = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  state.players[localPlayer].cities.push(city);
  calculateCitizens(state.players[localPlayer].map, city);

  const c = newCity(0, 'Enemy', 12, 15);
  c.workedTiles = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  state.players[localPlayer].cities.push(c);
  calculateCitizens(state.players[localPlayer].map, c);

  spawnUnitForPlayer(state, 1, UnitPrototypeId.Musketeers, 11, 16);

  updateUiState('selectedCity', city);
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

  // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
  switch (result?.type) {
    case 'UnitMoved':
      await animateUnitMoved(result);
      break;

    case 'Combat':
      await animateCombat(result);
      break;

    case 'ActionFailed':
      // TODO: handle failed actions
      console.log('Action failed:', result.reason);
      break;

    case 'CityBuilt':
      updateUiState('selectedCity', result.city);
      pushUiScreen(uiCityScreen);
      break;
  }
  ensureSelectedUnitIsInViewport();
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
