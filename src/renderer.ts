import { assets } from "./assets";
import { GameState, PlayerState } from "./game-state";
import {
  GameMap,
  getTerrainMaskCross,
  getTerrainMaskNorthEast,
  getTerrainMaskNorthWest,
  getTerrainMaskSouthEast,
  getTerrainMaskSouthWest,
  getTileAt,
  Terrain,
} from "./map";

const terrainSpriteMapIndex = {
  [Terrain.Desert]: 0,
  [Terrain.Plains]: 1,
  [Terrain.Grassland]: 2,
  [Terrain.Forest]: 3,
  [Terrain.Hills]: 4,
  [Terrain.Mountains]: 5,
  [Terrain.Tundra]: 6,
  [Terrain.Arctic]: 7,
  [Terrain.Swamp]: 8,
  [Terrain.Jungle]: 9,
};

const canvas: HTMLCanvasElement = document.querySelector("#game-canvas");
const context2d = canvas.getContext("2d");

/*canvas.addEventListener("mouseup", (evt) => {
  const canvasBounds = canvas.getBoundingClientRect();
  const relX = evt.offsetX / canvasBounds.width - 0.5;
  const relY = evt.offsetY / canvasBounds.height - 0.5;
  context2d.translate(Math.floor(-relX * canvas.width), Math.floor(-relY * canvas.height));
  renderEarth().catch((err) => console.error(err));
});*/

export const renderMap = (map: GameMap) => {
  const ter257 = assets["/assets/ter257.pic.gif"] as HTMLImageElement;
  const sp257 = assets["/assets/sp257.pic.gif"] as HTMLImageElement;

  for (let x = 0; x < map.width; x++) {
    for (let y = 0; y < map.height; y++) {
      const tile = map.tiles[x + y * map.width];

      if (tile.hidden) {
        context2d.fillRect(x * 16, y * 16, 16, 16);
        continue;
      }

      switch (tile.terrain) {
        // Rivers are a special case because they also connect to ocean tiles
        case Terrain.River: {
          context2d.drawImage(sp257, 0, 4 * 16, 16, 16, x * 16, y * 16, 16, 16);

          const riverMask = getTerrainMaskCross(map, x, y, Terrain.River);
          const oceanMask = getTerrainMaskCross(map, x, y, Terrain.Ocean);
          context2d.drawImage(sp257, (riverMask | oceanMask) * 16, 4 * 16, 16, 16, x * 16, y * 16, 16, 16);
          break;
        }

        // Ocean tiles are split up in 4 8x8 tiles, one for each corner of the 16x16 tile
        case Terrain.Ocean: {
          const nwMask = getTerrainMaskNorthWest(map, x, y, Terrain.Ocean);
          context2d.drawImage(ter257, (nwMask ^ 0b111) * 16, 11 * 16, 8, 8, x * 16, y * 16, 8, 8);

          const neMask = getTerrainMaskNorthEast(map, x, y, Terrain.Ocean);
          context2d.drawImage(ter257, (neMask ^ 0b111) * 16 + 8, 11 * 16, 8, 8, x * 16 + 8, y * 16, 8, 8);

          const seMask = getTerrainMaskSouthEast(map, x, y, Terrain.Ocean);
          context2d.drawImage(ter257, (seMask ^ 0b111) * 16 + 8, 11 * 16 + 8, 8, 8, x * 16 + 8, y * 16 + 8, 8, 8);

          const swMask = getTerrainMaskSouthWest(map, x, y, Terrain.Ocean);
          context2d.drawImage(ter257, (swMask ^ 0b111) * 16, 11 * 16 + 8, 8, 8, x * 16, y * 16 + 8, 8, 8);

          // Check for river outlets
          if (getTileAt(map, x, y - 1).terrain === Terrain.River) {
            context2d.drawImage(ter257, 8 * 16, 11 * 16, 16, 16, x * 16, y * 16, 16, 16);
          }
          if (getTileAt(map, x + 1, y).terrain === Terrain.River) {
            context2d.drawImage(ter257, 9 * 16, 11 * 16, 16, 16, x * 16, y * 16, 16, 16);
          }
          if (getTileAt(map, x, y + 1).terrain === Terrain.River) {
            context2d.drawImage(ter257, 10 * 16, 11 * 16, 16, 16, x * 16, y * 16, 16, 16);
          }
          if (getTileAt(map, x - 1, y).terrain === Terrain.River) {
            context2d.drawImage(ter257, 11 * 16, 11 * 16, 16, 16, x * 16, y * 16, 16, 16);
          }

          if (tile.specialResource) {
            context2d.drawImage(sp257, 10 * 16 + 1, 7 * 16 + 1, 15, 15, x * 16, y * 16, 15, 15);
          }
          break;
        }

        case Terrain.Void:
          context2d.fillRect(x * 16, y * 16, 16, 16);
          break;

        default: {
          // First draw base grass background, then add terrain specific overlay
          context2d.drawImage(sp257, 0, 4 * 16, 16, 16, x * 16, y * 16, 16, 16);

          const terrainMask = getTerrainMaskCross(map, x, y, tile.terrain);
          const terrainOffset = terrainSpriteMapIndex[tile.terrain];
          context2d.drawImage(ter257, terrainMask * 16, terrainOffset * 16, 16, 16, x * 16, y * 16, 16, 16);

          if (tile.specialResource) {
            if (tile.terrain === Terrain.Grassland) {
              context2d.drawImage(sp257, 9 * 16 + 8 + 1, 2 * 16 + 8 + 1, 7, 7, x * 16 + 4, y * 16 + 4, 7, 7);
            } else {
              context2d.drawImage(sp257, terrainOffset * 16 + 1, 7 * 16 + 1, 15, 15, x * 16, y * 16, 15, 15);
            }
          }
          break;
        }
      }

      // Render the disolve edge near hidden tiles
      if (getTileAt(map, x, y - 1).hidden) {
        context2d.drawImage(sp257, 5 * 16, 8 * 16, 16, 16, x * 16, y * 16, 16, 16);
      }
      if (getTileAt(map, x + 1, y).hidden) {
        context2d.drawImage(sp257, 6 * 16, 8 * 16, 16, 16, x * 16, y * 16, 16, 16);
      }
      if (getTileAt(map, x, y + 1).hidden) {
        context2d.drawImage(sp257, 7 * 16, 8 * 16, 16, 16, x * 16, y * 16, 16, 16);
      }
      if (getTileAt(map, x - 1, y).hidden) {
        context2d.drawImage(sp257, 8 * 16, 8 * 16, 16, 16, x * 16, y * 16, 16, 16);
      }
    }
  }
};

export const renderPlayer = (player: PlayerState, time: number) => {
  const sp257 = assets["/assets/sp257.pic.gif"] as HTMLImageElement;

  const selectedUnit = player.units[player.selectedUnit];
  for (const unit of player.units) {
    if (unit !== selectedUnit || (time * 0.006) % 2 < 1) {
      context2d.drawImage(sp257, unit.prototype * 16, 10 * 16 + 1, 16, 15, unit.x * 16, unit.y * 16, 16, 15);
    }
  }
};

export const renderState = (state: GameState, time: number) => {
  renderMap(state.players[0].map);
  for (const player of state.players) {
    renderPlayer(player, time);
  }
};
