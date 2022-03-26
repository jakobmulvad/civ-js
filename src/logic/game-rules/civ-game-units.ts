import { randomIntBelow } from '../../helpers';
import { UnitAction, UnitActionMove } from '../action';
import { ActionResult, UnitCombatResult, UnitMoveResult } from '../action-result';
import { getCityAt, newCity } from '../city';
import { attackStrength, defenseStrength } from '../formulas';
import {
  GameState,
  getPrototype,
  getSelectedUnitForPlayer,
  getTileAtUnit,
  getUnitsAt,
  removeUnitFromGame,
} from '../game-state';
import { exploreMapAround, getTileAt, getTilesCross, TerrainId, terrainMap, wrapXAxis } from '../map';
import { newUnit, Unit, UnitPrototypeId, unitPrototypeMap, UnitState, UnitType } from '../units';
import { validateUnitAction } from './action-validation';
import { captureCity } from './civ-game-cities';

const resolveCombatWinner = (state: GameState, winner: Unit, loser: Unit) => {
  removeUnitFromGame(state, loser);

  if (Math.random() > 0.5) {
    winner.isVeteran = true;
  }
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

  const newX = wrapXAxis(state.masterMap, unit.x + action.dx);
  const newY = unit.y + action.dy;
  const targetTile = getTileAt(state.masterMap, newX, newY);
  const prototype = unitPrototypeMap[unit.prototypeId];

  if (targetTile.terrain === TerrainId.Ocean && prototype.type === UnitType.Land) {
    // Todo: add check if ocean square contains transport
    return;
  }

  const tileUnits = getUnitsAt(state, newX, newY);
  if (tileUnits.length > 0 && tileUnits[0].owner !== action.player) {
    return executeAttack(state, action, unit, tileUnits);
  }

  const tileCity = getCityAt(state, newX, newY);
  if (tileCity && tileCity.owner !== action.player) {
    // Capture city!
    captureCity(state, tileCity, action.player);
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
