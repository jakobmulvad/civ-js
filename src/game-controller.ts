import { animate, isAnimating } from "./animation";
import { GameState, PlayerType } from "./game-state";
import { GameAction, keyboardMapping } from "./keyboard";
import { generateMapFromTemplate, getTileAt, getTileIndex, Terrain, terrainValueMap } from "./map";
import { renderWorld } from "./renderer";
import { RenderViewport } from "./types";
import { newUnit, UnitPrototypeId, unitPrototypeMap, UnitType } from "./unit";

let state: GameState;

const viewport: RenderViewport = {
  screenX: 320 - 15 * 16,
  screenY: 200 - 12 * 16,
  x: 0,
  y: 0,
  width: 15,
  height: 12,
};

const centerViewport = (x: number, y: number) => {
  const newX = x - (viewport.width >> 1);
  const newY = y - (viewport.height >> 1);
  viewport.x = (newX + state.masterMap.width) % state.masterMap.width;
  viewport.y = Math.max(0, Math.min(state.masterMap.height - viewport.height, newY));
};

const centerViewportIfNeeded = (x: number, y: number) => {
  if (
    Math.abs(x - (viewport.x + (viewport.width >> 1))) > 5 ||
    Math.abs(y - (viewport.y + (viewport.height >> 1))) > 3
  ) {
    centerViewport(x, y);
  }
};

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

export const newGame = async () => {
  const seed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
  const newMap = await generateMapFromTemplate("/assets/earth.json");

  // Assign special resources based on seed
  for (let x = 0; x < newMap.width; x++) {
    for (let y = 0; y < newMap.height; y++) {
      const idx = getTileIndex(newMap, x, y);
      const tile = newMap.tiles[idx];
      if (tile.terrain === Terrain.Grassland) {
        tile.specialResource = !!((x * 7 + (y - 2) * 11) & 0x02);
      } else {
        tile.specialResource = (x % 4) * 4 + (y % 4) === ((x / 4) * 13 + (y / 4) * 11 + seed) % 16;
      }
    }
  }

  state = {
    seed,
    playerInTurn: 0,
    players: [
      {
        color: "#FF00FF",
        name: "Weevil",
        map: {
          width: newMap.width,
          height: newMap.height,
          tiles: newMap.tiles.map((tile) => ({ ...tile, hidden: false })),
        },
        units: [],
        type: PlayerType.Computer,
        selectedUnit: 0,
      },
    ],
    masterMap: newMap,
    turn: 0,
  };

  spawnUnitForPlayer(0, UnitPrototypeId.Settlers, 8, 8);
  spawnUnitForPlayer(0, UnitPrototypeId.Cavalry, 10, 9);
  startTurn();
};

const selectNextUnit = () => {
  const player = state.players[state.playerInTurn];
  player.selectedUnit = player.units.findIndex((unit) => unit.movesLeft > 0);

  if (player.selectedUnit === -1) {
    return;
  }

  const unit = player.units[player.selectedUnit];
  centerViewportIfNeeded(unit.x, unit.y);
};

const handleMoveUnit = async (dx: number, dy: number) => {
  const player = state.players[state.playerInTurn];

  if (player.selectedUnit === -1) {
    return;
  }

  const unitIdx = player.selectedUnit;
  const unit = player.units[unitIdx];

  if (unit.movesLeft === 0) {
    return;
  }

  centerViewportIfNeeded(unit.x, unit.y);

  // Is unit trying to move out of bounds on y-axis?
  if ((dy < 0 && unit.y === 0) || (dy > 0 && unit.y === state.masterMap.height - 1)) {
    return;
  }

  const newX = (unit.x + dx + state.masterMap.width) % state.masterMap.width; // wrap-around on x-axis
  const newY = unit.y + dy;
  const targetTile = getTileAt(state.masterMap, newX, newY);
  const prototype = unitPrototypeMap[unit.prototypeId];

  if (targetTile.terrain === Terrain.Ocean && prototype.type == UnitType.Land) {
    // Todo: add check if ocean square contains transport
    return;
  }

  player.selectedUnit = -1; // disable blinking
  await animate((time) => {
    const progress = Math.floor(time * 0.06);
    unit.screenOffsetX = dx * progress;
    unit.screenOffsetY = dy * progress;
    return progress === 16;
  });
  player.selectedUnit = unitIdx;

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

const handleAction = async (action: GameAction, player: number): Promise<void> => {
  if (isAnimating()) {
    return;
  }

  console.log("handleAction", action, player);
  if (state.playerInTurn !== player) {
    throw new Error(`Player ${player} cannot take actions out of turn`);
  }

  switch (action) {
    case GameAction.MoveUnitNorth:
      return handleMoveUnit(0, -1);
    case GameAction.MoveUnitNorthEast:
      return handleMoveUnit(1, -1);
    case GameAction.MoveUnitEast:
      return handleMoveUnit(1, 0);
    case GameAction.MoveUnitSouthEast:
      return handleMoveUnit(1, 1);
    case GameAction.MoveUnitSouth:
      return handleMoveUnit(0, 1);
    case GameAction.MoveUnitSouthWest:
      return handleMoveUnit(-1, 1);
    case GameAction.MoveUnitWest:
      return handleMoveUnit(-1, 0);
    case GameAction.MoveUnitNorthWest:
      return handleMoveUnit(-1, -1);
    case GameAction.EndTurn:
      return endTurn();
    case GameAction.Center: {
      const player = state.players[state.playerInTurn];

      if (player.selectedUnit === -1) {
        return;
      }

      const unit = player.units[player.selectedUnit];
      return centerViewport(unit.x, unit.y);
    }

    default:
      console.log("Unhandled game action: ", action);
  }
};

document.addEventListener("keydown", (evt) => {
  if (!state) {
    return;
  }
  console.log("keydown", evt.code);
  const action = keyboardMapping[evt.code];
  if (action) {
    handleAction(action, 0).catch((err) => console.error(`Failed to perform action ${action}:`, err));
  }
});

const canvas: HTMLCanvasElement = document.querySelector("#game-canvas");
canvas.addEventListener("mousedown", (evt) => {
  const canvasBounds = canvas.getBoundingClientRect();
  const relX = evt.offsetX / canvasBounds.width;
  const relY = evt.offsetY / canvasBounds.height;
  const viewportX = Math.floor(relX * 320) - viewport.screenX;
  const viewportY = Math.floor(relY * 200) - viewport.screenY;

  centerViewport(viewport.x + (viewportX >> 4), viewport.y + (viewportY >> 4));
});

const frameHandler = (time: number) => {
  requestAnimationFrame(frameHandler);
  if (!state) {
    return;
  }
  renderWorld(state, time, viewport);
};
requestAnimationFrame(frameHandler);
