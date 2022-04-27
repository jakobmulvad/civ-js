import { randomIntBelow } from '../../helpers';
import { Action } from '../action';
import { ActionResult, StartTurnResult } from '../action-result';
import { Civilization } from '../civilizations';
import { Difficulty } from '../diffculty';
import { GameState, getSelectedUnitForPlayer, PlayerController, PlayerState } from '../game-state';
import { GovernmentId } from '../government';
import { GameMap, getTileAt, getTileIndex, MapTemplate, TerrainId } from '../map';
import { UnitPrototypeId, UnitState } from '../units';
import { validatePlayerAction } from './action-validation';
import { executeCityAction, processCity } from './civ-game-cities';
import { executeUnitAction, processUnit, spawnUnitForPlayer } from './civ-game-units';

const selectNextUnit = (state: GameState) => {
  const player = state.players[state.playerInTurn];
  const unitsWithMoves = player.units.filter((unit) => unit.movesLeft > 0 && unit.state === UnitState.Idle);

  if (unitsWithMoves.length === 0) {
    player.selectedUnit = undefined;
    return;
  }

  const currentSelected = getSelectedUnitForPlayer(state, state.playerInTurn);
  const currentIndex = unitsWithMoves.findIndex((unit) => unit === currentSelected);

  const newIndex = currentIndex > -1 ? (currentIndex + 1) % unitsWithMoves.length : 0;
  const newSelected = unitsWithMoves[newIndex];
  player.selectedUnit = player.units.indexOf(newSelected);
};

const startTurn = (state: GameState): StartTurnResult => {
  const result: StartTurnResult = { type: 'StartTurn', events: [] };
  const player = state.players[state.playerInTurn];

  // Process each city
  for (const city of player.cities) {
    result.events = [...result.events, ...processCity(state, city)];
  }

  // Process each unit
  for (const unit of player.units) {
    result.events = [...result.events, ...processUnit(state, unit)];
  }

  if (player.government === GovernmentId.Anarchy && state.turn % 4 === 0) {
    result.events.push({ type: 'EstablishGovernment' });
  }

  selectNextUnit(state);
  return result;
};

export const executeAction = (state: GameState, action: Action): ActionResult => {
  console.log('Executing action', action);

  if ('unit' in action) {
    return executeUnitAction(state, action);
  }

  if ('city' in action) {
    return executeCityAction(state, action);
  }

  validatePlayerAction(state, action);
  const player = state.players[action.player];

  // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
  switch (action.type) {
    case 'EndTurn':
      state.playerInTurn = (state.playerInTurn + 1) % state.players.length;

      if (state.playerInTurn === 0) {
        // New turn
        state.turn++;
      }

      return startTurn(state);

    case 'Revolution':
      player.government = GovernmentId.Anarchy;
      break;

    case 'EstablishGovernment':
      if (player.government !== GovernmentId.Anarchy) {
        return { type: 'ActionFailed', reason: 'GovernmentIntact' };
      }

      if (state.turn % 4 !== 0) {
        // Government not in anarchy or revolt is still ongoing
        return { type: 'ActionFailed', reason: 'StillRevolting' };
      }
      player.government = action.government;
      break;

    case 'SetTaxRate':
      if (action.rate < 0 || action.rate > 10 - player.luxuryRate) {
        return { type: 'ActionFailed', reason: 'InvalidRate' };
      }
      player.taxRate = action.rate;
      break;

    case 'SetLuxuryRate':
      if (action.rate < 0 || action.rate > 10 - player.taxRate) {
        return { type: 'ActionFailed', reason: 'InvalidRate' };
      }
      player.luxuryRate = action.rate;
      break;
  }
};

export const newGame = (mapTemplate: MapTemplate, civs: Civilization[]): GameState => {
  console.log('New game');
  const seed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);

  const map: GameMap = {
    width: mapTemplate.width,
    height: mapTemplate.height,
    tiles: mapTemplate.data.map((terrain) => ({ terrain })),
  };

  // Assign special resources based on seed
  for (let x = 0; x < map.width; x++) {
    for (let y = 0; y < map.height; y++) {
      const idx = getTileIndex(map, x, y);
      const tile = map.tiles[idx];
      tile.extraShield = !!((x * 7 + (y - 2) * 11) & 0x02);
      tile.specialResource = (x % 4) * 4 + (y % 4) === ((x >> 2) * 13 + (y >> 2) * 11 + seed) % 16;
    }
  }

  const players: PlayerState[] = civs.map((civ) => ({
    civ,
    map: {
      ...map,
      tiles: map.tiles.map((tile) => ({ ...tile, hidden: false })),
    },
    units: [],
    cities: [],
    controller: PlayerController.Computer,
    selectedUnit: -1,
    gold: 0,
    beakers: 0,
    taxRate: 5,
    luxuryRate: 5,
    government: GovernmentId.Democracy,
  }));

  const state: GameState = {
    seed,
    playerInTurn: 0,
    players,
    masterMap: map,
    turn: 0,
    difficulty: Difficulty.Emperor,
  };

  // Spawn first settlers
  const suitableStartTerrain = [TerrainId.Grassland, TerrainId.Plains, TerrainId.River];
  for (let i = 0; i < civs.length; i++) {
    let x: number;
    let y: number;
    let terrain: TerrainId;
    let tries = 0;

    do {
      tries++;
      x = randomIntBelow(map.width);
      y = randomIntBelow(map.height);
      terrain = getTileAt(map, x, y).terrain;
    } while (!suitableStartTerrain.includes(terrain) && tries < 100);

    spawnUnitForPlayer(state, i, UnitPrototypeId.Settlers, x, y);
  }

  startTurn(state);
  return state;
};
