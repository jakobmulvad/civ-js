import { GameState, PlayerType } from "./game-state";
import { GameAction, keyboardMapping } from "./keyboard";
import { generateMapFromTemplate, getTileAt, getTileIndex, MapTile, Terrain } from "./map";
import { renderState } from "./renderer";
import { UnitPrototypeId, UnitPrototypeMap, UnitType } from "./unit";

let state: GameState;

/*const canvas: HTMLCanvasElement = document.querySelector("#game-canvas");
canvas.addEventListener("mouseup", (evt) => {
  const canvasBounds = canvas.getBoundingClientRect();
  const relX = evt.offsetX / canvasBounds.width - 0.5;
  const relY = evt.offsetY / canvasBounds.height - 0.5;
  context2d.translate(Math.floor(-relX * canvas.width), Math.floor(-relY * canvas.height));
  renderEarth().catch((err) => console.error(err));
});*/

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
  const prototype = UnitPrototypeMap[id];
  const unitState = { prototype: id, x, y, movesLeft: prototype.moves };
  state.players[player].units.push(unitState);

  discoverMapAround(player, x, y);
};

export const startTurn = () => {
  const player = state.players[state.playerInTurn];

  for (const unit of player.units) {
    discoverMapAround(state.playerInTurn, unit.x, unit.y);
  }
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
          tiles: newMap.tiles.map((tile) => ({ ...tile, hidden: true })),
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
  spawnUnitForPlayer(0, UnitPrototypeId.Militia, 10, 9);
  startTurn();
};

const handleMoveUnit = (dx: number, dy: number) => {
  const player = state.players[state.playerInTurn];
  const unit = player.units[player.selectedUnit];

  if (unit.movesLeft === 0) {
    return;
  }

  if ((dy < 0 && unit.y === 0) || (dy > 0 && unit.y === state.masterMap.height - 1)) {
    return;
  }

  const newX = (unit.x + dx + state.masterMap.width) % state.masterMap.width; // wrap-around on x-axis
  const newY = unit.y + dy;
  const targetTile = getTileAt(state.masterMap, newX, newY);
  const prototype = UnitPrototypeMap[unit.prototype];

  if (targetTile.terrain === Terrain.Ocean && prototype.type == UnitType.Land) {
    // Todo: add check if ocean square contains transport
    return;
  }

  unit.x = newX;
  unit.y = newY;
  discoverMapAround(state.playerInTurn, unit.x, unit.y);
};

const handleAction = (action: GameAction, player: number) => {
  console.log("handleAction", action, player);
  if (state.playerInTurn !== player) {
    throw new Error(`Player ${player} cannot take actions out of turn`);
  }

  switch (action) {
    case GameAction.MoveUnitNorth:
      handleMoveUnit(0, -1);
      break;
    case GameAction.MoveUnitNorthEast:
      handleMoveUnit(1, -1);
      break;
    case GameAction.MoveUnitEast:
      handleMoveUnit(1, 0);
      break;
    case GameAction.MoveUnitSouthEast:
      handleMoveUnit(1, 1);
      break;
    case GameAction.MoveUnitSouth:
      handleMoveUnit(0, 1);
      break;
    case GameAction.MoveUnitSouthWest:
      handleMoveUnit(-1, 1);
      break;
    case GameAction.MoveUnitWest:
      handleMoveUnit(-1, 0);
      break;
    case GameAction.MoveUnitNorthWest:
      handleMoveUnit(-1, -1);
      break;
  }
};

document.addEventListener("keydown", (evt) => {
  if (!state) {
    return;
  }

  const action = keyboardMapping[evt.code];

  if (action) {
    handleAction(action, 0);
  }
});

const frameHandler = (time: number) => {
  requestAnimationFrame(frameHandler);
  if (!state) {
    return;
  }
  renderState(state, time);
};
requestAnimationFrame(frameHandler);
