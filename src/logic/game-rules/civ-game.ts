import { randomIntBelow } from '../../helpers';
import { Action } from '../action';
import { ActionResult } from '../action-result';
import { Civilization } from '../civilizations';
import { GameState, getSelectedUnitForPlayer, PlayerController, PlayerState } from '../game-state';
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

const startTurn = (state: GameState) => {
  const player = state.players[state.playerInTurn];

  // Process each city
  for (const city of player.cities) {
    processCity(state, city);
  }

  // Process each unit
  for (const unit of player.units) {
    processUnit(state, unit);
  }

  selectNextUnit(state);
};

export const executeAction = (state: GameState, action: Action): ActionResult => {
  console.log('Executing action', action);

  if (action.type === 'EndTurn') {
    validatePlayerAction(state, action);
    state.playerInTurn = (state.playerInTurn + 1) % state.players.length;

    if (state.playerInTurn === 0) {
      // New turn
      state.turn++;
    }

    return startTurn(state);
  }

  if ('unit' in action) {
    return executeUnitAction(state, action);
  }

  if ('city' in action) {
    return executeCityAction(state, action);
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
    luxuryRate: 0,
  }));

  const state = {
    seed,
    playerInTurn: 0,
    players,
    masterMap: map,
    turn: 0,
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

  //spawnUnitForPlayer(state, 0, UnitPrototypeId.Settlers, 8, 15);
  //spawnUnitForPlayer(state, 0, UnitPrototypeId.Settlers, 9, 15);

  startTurn(state);
  return state;
};
