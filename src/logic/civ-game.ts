import { randomIntBelow } from '../helpers';
import { ActionWithPlayer, ActionWithUnit, PlayerAction, UnitAction, UnitActionMove } from './action';
import { Civilization } from './civilizations';
import { GameState, PlayerController, PlayerState } from './game-state';
import { GameMap, getTileAt, getTileIndex, MapTemplate, TerrainId, terrainValueMap } from './map';
import { newUnit, Unit, UnitPrototypeId, unitPrototypeMap, UnitType } from './units';

export type MoveUnitResult =
  | {
      outcome: 'UnitMoved';
      unit: Unit;
    }
  | {
      outcome: 'UnitMoveDenied';
    }
  | {
      outcome: 'Combat';
      attacker: Unit;
      defender: Unit;
      winner: 'Attacker' | 'Defender';
    };

const discoverMapTile = (state: GameState, player: number, x: number, y: number) => {
  const idx = getTileIndex(state.masterMap, x, y);
  state.players[player].map.tiles[idx] = { ...state.masterMap.tiles[idx], hidden: false };
};

const discoverMapAround = (state: GameState, player: number, x: number, y: number) => {
  discoverMapTile(state, player, x - 1, y - 1);
  discoverMapTile(state, player, x, y - 1);
  discoverMapTile(state, player, x + 1, y - 1);
  discoverMapTile(state, player, x - 1, y);
  discoverMapTile(state, player, x, y);
  discoverMapTile(state, player, x + 1, y);
  discoverMapTile(state, player, x - 1, y + 1);
  discoverMapTile(state, player, x, y + 1);
  discoverMapTile(state, player, x + 1, y + 1);
};

export const spawnUnitForPlayer = (state: GameState, player: number, id: UnitPrototypeId, x: number, y: number) => {
  const unit = newUnit(id, x, y);
  state.players[player].units.push(unit);

  discoverMapAround(state, player, x, y);
};

export const selectNextUnit = (state: GameState) => {
  const player = state.players[state.playerInTurn];
  const unitsWithMoves = player.units.filter((unit) => unit.movesLeft > 0);

  if (unitsWithMoves.length === 0) {
    player.selectedUnit = -1;
    return;
  }

  const currentIndex = unitsWithMoves.findIndex((unit) => unit === player.units[player.selectedUnit]);
  const newIndex = (currentIndex + 1) % unitsWithMoves.length;
  const newSelected = unitsWithMoves[newIndex];
  player.selectedUnit = player.units.findIndex((unit) => unit === newSelected);
};

const startTurn = (state: GameState) => {
  const player = state.players[state.playerInTurn];

  for (const unit of player.units) {
    const prototype = unitPrototypeMap[unit.prototypeId];
    unit.movesLeft = prototype.moves * 3;
    discoverMapAround(state, state.playerInTurn, unit.x, unit.y);
  }
  selectNextUnit(state);
};

const validatePlayerAction = (state: GameState, action: ActionWithPlayer) => {
  if (action.player !== state.playerInTurn) {
    throw new Error(`Player ${action.player} cannot issue actions out of turn`);
  }
};

const validateUnitAction = (state: GameState, action: ActionWithUnit) => {
  validatePlayerAction(state, action);

  const unit = state.players[action.player]?.units[action.unit];

  if (!unit) {
    throw new Error(`Player ${action.player} cannot issue unit action on unit ${action.unit} because it doesn't exist`);
  }

  if (unit.movesLeft === 0) {
    throw new Error(
      `Player ${action.player} cannot issue unit action on unit ${action.unit} because it doesn't have moves left`
    );
  }

  return unit;
};

export const handleEndTurn = (state: GameState, action: ActionWithPlayer) => {
  validatePlayerAction(state, action);

  state.playerInTurn = (state.playerInTurn + 1) % state.players.length;
  startTurn(state);
};

export const handleMoveUnit = (state: GameState, action: UnitActionMove): MoveUnitResult => {
  const unit = validateUnitAction(state, action);

  // Is unit trying to move out of bounds on y-axis?
  if ((action.dy < 0 && unit.y === 0) || (action.dy > 0 && unit.y === state.masterMap.height - 1)) {
    return { outcome: 'UnitMoveDenied' };
  }

  const newX = (unit.x + action.dx + state.masterMap.width) % state.masterMap.width; // wrap-around on x-axis
  const newY = unit.y + action.dy;
  const targetTile = getTileAt(state.masterMap, newX, newY);
  const prototype = unitPrototypeMap[unit.prototypeId];

  if (targetTile.terrain === TerrainId.Ocean && prototype.type == UnitType.Land) {
    // Todo: add check if ocean square contains transport
    return { outcome: 'UnitMoveDenied' };
  }

  unit.x = newX;
  unit.y = newY;

  const terrain = terrainValueMap[targetTile.terrain];
  unit.movesLeft = Math.max(0, unit.movesLeft - terrain.movementCost * 3);

  if (unit.movesLeft === 0) {
    selectNextUnit(state);
  }

  return { outcome: 'UnitMoved', unit };
};

export const handleUnitNoOrder = (state: GameState, action: ActionWithUnit) => {
  const unit = validateUnitAction(state, action);
  unit.movesLeft = 0;
  selectNextUnit(state);
};

export const handleUnitWait = (state: GameState, action: ActionWithUnit) => {
  validateUnitAction(state, action);
  selectNextUnit(state);
};

/*export const handlePlayerAction = (state: GameState, action: Action) => {
  switch (action.type) {
    case 'UnitMove':
      return handleMoveUnit(state, action);

    case 'UnitWait':
      return handleUnitWait(state, action);

    case 'UnitNoOrders':
      return handleNoOrder(state, action);

    case 'EndTurn':
      return handleEndTurn(state, action);
  }
};*/

export const newGame = (mapTemplate: MapTemplate, civs: Civilization[]): GameState => {
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
    controller: PlayerController.Computer,
    selectedUnit: -1,
    gold: 0,
    beakers: 0,
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
    } while (!suitableStartTerrain.includes(terrain) || tries < 100);

    spawnUnitForPlayer(state, i, UnitPrototypeId.Settlers, x, y);
  }

  startTurn(state);
  return state;
};
