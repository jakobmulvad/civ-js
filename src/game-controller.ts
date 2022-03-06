import { Action, ActionUnitMove, popAction } from './action';
import { animate } from './animation';
import { GameState, PlayerState, PlayerType } from './game-state';
import { GameMap, generateMapFromTemplate, getTileAt, getTileIndex, Terrain, terrainValueMap } from './map';
import { generateUnitSpriteSheet } from './renderer';
import { uiClear, uiPushScreen } from './ui/ui-controller';
import { centerViewportIfNeeded, setWorldUiGameState, uiWorldView } from './ui/ui-worldview';
import { newUnit, UnitPrototypeId, unitPrototypeMap, UnitType } from './unit';

let state: GameState;

export const playerInTurn = () => state.players[state.playerInTurn];

export const discoverMap = (player: number, x: number, y: number) => {
  const idx = getTileIndex(state.masterMap, x, y);
  state.players[player].map.tiles[idx] = { ...state.masterMap.tiles[idx], hidden: false };
};

export const discoverMapAround = (player: number, x: number, y: number) => {
  discoverMap(player, x - 1, y - 1);
  discoverMap(player, x, y - 1);
  discoverMap(player, x + 1, y - 1);
  discoverMap(player, x - 1, y);
  discoverMap(player, x, y);
  discoverMap(player, x + 1, y);
  discoverMap(player, x - 1, y + 1);
  discoverMap(player, x, y + 1);
  discoverMap(player, x + 1, y + 1);
};

export const spawnUnitForPlayer = (player: number, id: UnitPrototypeId, x: number, y: number) => {
  const unit = newUnit(id, x, y);
  state.players[player].units.push(unit);

  discoverMapAround(player, x, y);
};

export const startTurn = () => {
  const player = state.players[state.playerInTurn];

  for (const unit of player.units) {
    const prototype = unitPrototypeMap[unit.prototypeId];
    unit.movesLeft = prototype.moves * 3;
    discoverMapAround(state.playerInTurn, unit.x, unit.y);
  }
  selectNextUnit();
};

export const endTurn = () => {
  state.playerInTurn = (state.playerInTurn + 1) % state.players.length;
  startTurn();
};

export const newPlayer = (
  map: GameMap,
  name: string,
  color: [number, number, number],
  type: PlayerType
): PlayerState => {
  return {
    color,
    name,
    map: {
      ...map,
      tiles: map.tiles.map((tile) => ({ ...tile, hidden: true })),
    },
    units: [],
    type,
    selectedUnit: -1,
  };
};

export const newGame = async () => {
  const seed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
  const newMap = await generateMapFromTemplate('/assets/earth.json');

  // Assign special resources based on seed
  for (let x = 0; x < newMap.width; x++) {
    for (let y = 0; y < newMap.height; y++) {
      const idx = getTileIndex(newMap, x, y);
      const tile = newMap.tiles[idx];
      tile.extraShield = !!((x * 7 + (y - 2) * 11) & 0x02);
      tile.specialResource = (x % 4) * 4 + (y % 4) === ((x >> 2) * 13 + (y >> 2) * 11 + seed) % 16;
    }
  }

  state = {
    seed,
    playerInTurn: 0,
    players: [
      newPlayer(newMap, 'Weevil', [234, 123, 34], PlayerType.Human),
      newPlayer(newMap, 'Evil', [210, 115, 255], PlayerType.Computer),
    ],
    masterMap: newMap,
    turn: 0,
  };

  generateUnitSpriteSheet(state.players.map((pl) => pl.color));

  spawnUnitForPlayer(0, UnitPrototypeId.Cavalry, 43, 12);
  spawnUnitForPlayer(0, UnitPrototypeId.Cavalry, 6, 9);
  spawnUnitForPlayer(1, UnitPrototypeId.Cavalry, 5, 10);

  uiClear();
  setWorldUiGameState(state);
  uiPushScreen(uiWorldView);

  startTurn();
};

export const selectNextUnit = () => {
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

  centerViewportIfNeeded(newSelected.x, newSelected.y);
};

export const handleMoveUnit = async (action: ActionUnitMove) => {
  if (action.player !== state.playerInTurn) {
    throw new Error(`Player ${action.player} cannot move out of turn`);
  }

  const player = state.players[action.player];
  if (player.selectedUnit === -1) {
    throw new Error(`Player ${action.player} has no units to move`);
  }

  const unit = player.units[player.selectedUnit];

  if (unit.movesLeft === 0) {
    return;
  }

  centerViewportIfNeeded(unit.x, unit.y);

  // Is unit trying to move out of bounds on y-axis?
  if ((action.dy < 0 && unit.y === 0) || (action.dy > 0 && unit.y === state.masterMap.height - 1)) {
    return;
  }

  const newX = (unit.x + action.dx + state.masterMap.width) % state.masterMap.width; // wrap-around on x-axis
  const newY = unit.y + action.dy;
  const targetTile = getTileAt(state.masterMap, newX, newY);
  const prototype = unitPrototypeMap[unit.prototypeId];

  if (targetTile.terrain === Terrain.Ocean && prototype.type == UnitType.Land) {
    // Todo: add check if ocean square contains transport
    return;
  }

  await animate((time) => {
    const progress = Math.floor(time * 0.06);
    unit.screenOffsetX = action.dx * progress;
    unit.screenOffsetY = action.dy * progress;
    return progress === 16;
  });

  unit.screenOffsetX = 0;
  unit.screenOffsetY = 0;
  unit.x = newX;
  unit.y = newY;
  discoverMapAround(state.playerInTurn, unit.x, unit.y);

  const terrainValues = terrainValueMap[targetTile.terrain];
  unit.movesLeft = Math.max(0, unit.movesLeft - terrainValues.movementCost * 3);

  if (unit.movesLeft === 0) {
    selectNextUnit();
  }
};

export const handleNoOrder = () => {
  const player = state.players[state.playerInTurn];

  if (player.selectedUnit === -1) {
    return;
  }

  const unit = player.units[player.selectedUnit];
  unit.movesLeft = 0;
  selectNextUnit();
};

export const handleAction = async (action: Action): Promise<void> => {
  switch (action.type) {
    case 'UnitMove':
      return handleMoveUnit(action);

    case 'UnitWait':
      return selectNextUnit();

    case 'UnitNoOrders':
      return handleNoOrder();

    case 'EndTurn':
      return endTurn();
  }
};

const logicFrame = () => {
  const action = popAction();

  if (action) {
    handleAction(action)
      .then(() => requestAnimationFrame(logicFrame))
      .catch((err) => {
        console.error(`Failed to process action ${action.type}: ${err as string}`);
        requestAnimationFrame(logicFrame);
      });
    return;
  }
  requestAnimationFrame(logicFrame);
};
requestAnimationFrame(logicFrame);
