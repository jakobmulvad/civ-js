import { randomIntBelow } from '../helpers';
import { Action, ActionWithPlayer, ActionWithUnit, CityTileAction, UnitAction, UnitActionMove } from './action';
import { calculateCitizens, newCity } from './city';
import { Civilization } from './civilizations';
import { attackStrength, defenseStrength } from './formulas';
import {
  GameState,
  getPlayersUnitsAt,
  getPrototype,
  getSelectedUnitForPlayer,
  getTileAtUnit,
  PlayerController,
  PlayerState,
  removeUnitFromGame,
} from './game-state';
import { GameMap, getTileAt, getTileIndex, getTilesCross, MapTemplate, TerrainId, terrainMap } from './map';
import { jobsDone, newUnit, Unit, UnitPrototypeId, unitPrototypeMap, UnitState, UnitType } from './units';

export type UnitMoveResult = {
  type: 'UnitMoved';
  unit: Unit;
  dx: number;
  dy: number;
};

export type UnitCombatResult = {
  type: 'Combat';
  dx: number;
  dy: number;
  attacker: Unit;
  defender: Unit;
  winner: 'Attacker' | 'Defender';
};

export type ActionFailedResult = {
  type: 'ActionFailed';
  reason: 'MissingWaterSupply' | 'UnitNotBuilder';
};

export type ActionResult = UnitMoveResult | UnitCombatResult | ActionFailedResult | void;

const exploreMap = (state: GameState, player: number, x: number, y: number) => {
  const idx = getTileIndex(state.masterMap, x, y);
  state.players[player].map.tiles[idx] = { ...state.masterMap.tiles[idx], hidden: false };
};

const exploreMapAround = (state: GameState, player: number, x: number, y: number) => {
  exploreMap(state, player, x - 1, y - 1);
  exploreMap(state, player, x, y - 1);
  exploreMap(state, player, x + 1, y - 1);
  exploreMap(state, player, x - 1, y);
  exploreMap(state, player, x, y);
  exploreMap(state, player, x + 1, y);
  exploreMap(state, player, x - 1, y + 1);
  exploreMap(state, player, x, y + 1);
  exploreMap(state, player, x + 1, y + 1);
};

export const spawnUnitForPlayer = (
  state: GameState,
  player: number,
  id: UnitPrototypeId,
  x: number,
  y: number
): Unit => {
  const unit = newUnit(id, x, y, player);
  state.players[player].units.push(unit);

  exploreMapAround(state, player, x, y);

  return unit;
};

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

  for (const unit of player.units) {
    const unitProto = unitPrototypeMap[unit.prototypeId];
    unit.movesLeft = unitProto.moves * 3;
    const tile = getTileAtUnit(state.masterMap, unit);
    const tileTerrain = terrainMap[tile.terrain];

    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
    switch (unit.state) {
      case UnitState.BuildingFortress:
      case UnitState.CleaningPolution:
      case UnitState.BuildingIrrigation:
        unit.progress++;
        // a bug in civ causes all tile improvements to complete 1 turn before intended - we explicitly add that bug here as well
        if (unit.progress === tileTerrain.movementCost * 2 - 1) {
          jobsDone(unit);
          tile.hasIrrigation = true;
        }
        break;

      case UnitState.BuildingMine:
        unit.progress++;
        if (unit.progress === 10 - 1) {
          jobsDone(unit);
          tile.hasMine = true;
        }
        break;

      case UnitState.Clearing:
        unit.progress++;
        if (unit.progress === (tileTerrain.clearCost ?? 5) - 1) {
          jobsDone(unit);
          const proto = terrainMap[tile.terrain];
          tile.terrain = proto.clearsTo ?? tile.terrain;
        }
        break;

      case UnitState.BuildingRoad: {
        unit.progress++;
        const cost = tile.hasRoad ? tileTerrain.movementCost * 4 : tileTerrain.movementCost * 2;
        if (unit.progress === cost - 1) {
          jobsDone(unit);
          if (tile.hasRoad) {
            tile.hasRailroad = true;
          } else {
            tile.hasRoad = true;
          }
        }
        break;
      }

      case UnitState.Fortifying:
        unit.state = UnitState.Fortified;
        break;
    }
    exploreMapAround(state, state.playerInTurn, unit.x, unit.y);
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

const resolveCombatWinner = (state: GameState, winner: Unit, loser: Unit) => {
  removeUnitFromGame(state, loser);

  if (Math.random() > 0.5) {
    winner.isVeteran = true;
  }
};

const executeAttack = (
  state: GameState,
  action: UnitActionMove,
  attacker: Unit,
  defenders: Unit[]
): UnitCombatResult => {
  const attackStr = attackStrength(attacker);

  let bestDefender: Unit = defenders[0];
  let bestDefenseStr = 0;

  const tile = getTileAt(state.masterMap, attacker.x + action.dx, attacker.y + action.dy);
  const terrain = terrainMap[tile.terrain];

  for (const defender of defenders) {
    const defenseStr = defenseStrength(defender, terrain, false);
    if (defenseStr > bestDefenseStr) {
      bestDefender = defender;
      bestDefenseStr = defenseStr;
    }
  }

  const attackRoll = randomIntBelow(attackStr);
  const defenseRoll = randomIntBelow(bestDefenseStr);

  console.log('Attack and defense str:', attackStr, bestDefenseStr);
  console.log('Attack and defense roll:', attackRoll, defenseRoll);

  const winner = attackRoll > defenseRoll ? 'Attacker' : 'Defender';

  if (winner === 'Attacker') {
    resolveCombatWinner(state, attacker, bestDefender);
  } else {
    resolveCombatWinner(state, bestDefender, attacker);
  }

  attacker.movesLeft = Math.max(0, attacker.movesLeft - 3);

  if (attacker.movesLeft === 0) {
    selectNextUnit(state);
  }

  return { type: 'Combat', attacker, defender: bestDefender, winner, dx: action.dx, dy: action.dy };
};

const executeMoveUnit = (state: GameState, action: UnitActionMove): UnitMoveResult | UnitCombatResult | void => {
  const unit = validateUnitAction(state, action);

  // Is unit trying to move out of bounds on y-axis?
  if ((action.dy < 0 && unit.y === 0) || (action.dy > 0 && unit.y === state.masterMap.height - 1)) {
    return;
  }

  const newX = (unit.x + action.dx + state.masterMap.width) % state.masterMap.width; // wrap-around on x-axis
  const newY = unit.y + action.dy;
  const targetTile = getTileAt(state.masterMap, newX, newY);
  const prototype = unitPrototypeMap[unit.prototypeId];

  if (targetTile.terrain === TerrainId.Ocean && prototype.type === UnitType.Land) {
    // Todo: add check if ocean square contains transport
    return;
  }

  for (let i = 0; i < state.players.length; i++) {
    if (i === action.player) {
      continue;
    }
    const enemyUnitsAtDest = getPlayersUnitsAt(state, i, newX, newY);
    if (enemyUnitsAtDest.length) {
      return executeAttack(state, action, unit, enemyUnitsAtDest);
    }
  }

  const tile = getTileAtUnit(state.masterMap, unit);

  unit.x = newX;
  unit.y = newY;

  if (tile.hasRoad && targetTile.hasRoad) {
    if (!tile.hasRailroad) {
      unit.movesLeft -= 1;
    }
  } else {
    const terrain = terrainMap[targetTile.terrain];
    unit.movesLeft = Math.max(0, unit.movesLeft - terrain.movementCost * 3);
  }

  exploreMapAround(state, action.player, newX, newY);
  if (unit.movesLeft === 0) {
    selectNextUnit(state);
  }

  return { type: 'UnitMoved', unit, dx: action.dx, dy: action.dy };
};

export const executeUnitAction = (state: GameState, action: UnitAction | UnitActionMove): ActionResult => {
  const unit = validateUnitAction(state, action);
  const unitProto = getPrototype(unit);
  const tile = getTileAt(state.masterMap, unit.x, unit.y);
  const terrain = terrainMap[tile.terrain];
  const player = state.players[state.playerInTurn];

  switch (action.type) {
    case 'UnitMove':
      return executeMoveUnit(state, action);

    case 'UnitWait':
      break;

    case 'UnitNoOrders': {
      unit.movesLeft = 0;
      break;
    }

    case 'UnitBuildIrrigation':
      if (unitProto.isBuilder && terrain.canIrrigate && !tile.hasIrrigation) {
        const crossTiles = getTilesCross(state.masterMap, unit.x, unit.y);
        if (!crossTiles.some((tile) => terrainMap[tile.terrain].givesAccessToWater || tile.hasIrrigation)) {
          return { type: 'ActionFailed', reason: 'MissingWaterSupply' };
        }
        unit.state = UnitState.BuildingIrrigation;
      }
      break;

    case 'UnitBuildMine':
      if (unitProto.isBuilder && terrain.mineYield && !tile.hasMine) {
        unit.state = UnitState.BuildingMine;
      }
      break;

    case 'UnitBuildRoad':
      if (unitProto.isBuilder && tile.terrain !== TerrainId.Ocean && !tile.hasRailroad) {
        // TODO: check for railroad tech
        // TODO: check for bridge building tech
        unit.state = UnitState.BuildingRoad;
      }
      break;

    case 'UnitBuildOrJoinCity': {
      if (!unitProto.isBuilder) {
        return;
      }

      const city = newCity(state.playerInTurn, 'Test', unit.x, unit.y);
      player.cities.push(city);

      if (terrain.canIrrigate) {
        tile.hasIrrigation = true;
      }
      tile.hasRoad = true;

      removeUnitFromGame(state, unit);
      exploreMapAround(state, state.playerInTurn, city.x, city.y);
      break;
    }

    case 'UnitClear':
      if (unitProto.isBuilder && terrain.clearsTo !== undefined) {
        unit.state = UnitState.Clearing;
      }
      break;

    case 'UnitFortify':
      if (unitProto.isCivil) {
        return;
      }
      unit.state = UnitState.Fortifying;
  }
  selectNextUnit(state);
};

export const executeCityAction = (state: GameState, action: CityTileAction): ActionResult => {
  const player = state.players[action.player];
  const city = player.cities[action.city];

  if (action.type === 'CityToggleTileWorker') {
    const isWorked = city.workedTiles.includes(action.tile);

    if (isWorked) {
      city.workedTiles = city.workedTiles.filter((tile) => tile !== action.tile);
    } else {
      city.workedTiles.push(action.tile);
    }

    calculateCitizens(player.map, city);
  }
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
    } while (!suitableStartTerrain.includes(terrain) || tries < 100);

    //spawnUnitForPlayer(state, i, UnitPrototypeId.Settlers, x, y);
  }

  spawnUnitForPlayer(state, 0, UnitPrototypeId.Settlers, 8, 15);
  spawnUnitForPlayer(state, 0, UnitPrototypeId.Settlers, 9, 15);

  startTurn(state);
  return state;
};
