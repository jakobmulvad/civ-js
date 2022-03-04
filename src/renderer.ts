import { loadImage } from "./assets";
import {
  GameMap,
  generateMapFromTemplate,
  getTerrainMaskCross,
  getTerrainMaskNorthEast,
  getTerrainMaskNorthWest,
  getTerrainMaskSouthEast,
  getTerrainMaskSouthWest,
  getTileAt,
  TerrainType,
} from "./map";

const terrainSpriteMapIndex = {
  [TerrainType.Desert]: 0,
  [TerrainType.Plains]: 1,
  [TerrainType.Grassland]: 2,
  [TerrainType.Forest]: 3,
  [TerrainType.Hills]: 4,
  [TerrainType.Mountains]: 5,
  [TerrainType.Tundra]: 6,
  [TerrainType.Arctic]: 7,
  [TerrainType.Swamp]: 8,
  [TerrainType.Jungle]: 9,
};

const canvas: HTMLCanvasElement = document.querySelector("#game-canvas");
const context2d = canvas.getContext("2d");

canvas.addEventListener("mouseup", (evt) => {
  const canvasBounds = canvas.getBoundingClientRect();
  const relX = evt.offsetX / canvasBounds.width - 0.5;
  const relY = evt.offsetY / canvasBounds.height - 0.5;
  context2d.translate(Math.floor(-relX * canvas.width), Math.floor(-relY * canvas.height));
  renderEarth().catch((err) => console.error(err));
});

const earthMapPromise = generateMapFromTemplate("/assets/earth.json");
const ter257Promise = loadImage("/assets/ter257.pic.gif");
const sp257Promise = loadImage("/assets/sp257.pic.gif");

export const renderEarth = async () => {
  const earthMap = await earthMapPromise;
  await renderMap(earthMap);
};

export const renderMap = async (map: GameMap) => {
  const ter257 = await ter257Promise;
  const sp257 = await sp257Promise;

  for (let x = 0; x < map.width; x++) {
    for (let y = 0; y < map.height; y++) {
      const tile = map.tiles[x + y * map.width];

      switch (tile.terrain) {
        // Rivers are a special case because they also connect to ocean tiles
        case TerrainType.River: {
          context2d.drawImage(sp257, 0, 4 * 16, 16, 16, x * 16, y * 16, 16, 16);

          const riverMask = getTerrainMaskCross(map, x, y, TerrainType.River);
          const oceanMask = getTerrainMaskCross(map, x, y, TerrainType.Ocean);
          context2d.drawImage(sp257, (riverMask | oceanMask) * 16, 4 * 16, 16, 16, x * 16, y * 16, 16, 16);
          break;
        }

        // Ocean tiles are split up in 4 8x8 tiles, one for each corner of the 16x16 tile
        case TerrainType.Ocean: {
          const nwMask = getTerrainMaskNorthWest(map, x, y, TerrainType.Ocean);
          context2d.drawImage(ter257, (nwMask ^ 0b111) * 16, 11 * 16, 8, 8, x * 16, y * 16, 8, 8);

          const neMask = getTerrainMaskNorthEast(map, x, y, TerrainType.Ocean);
          context2d.drawImage(ter257, (neMask ^ 0b111) * 16 + 8, 11 * 16, 8, 8, x * 16 + 8, y * 16, 8, 8);

          const seMask = getTerrainMaskSouthEast(map, x, y, TerrainType.Ocean);
          context2d.drawImage(ter257, (seMask ^ 0b111) * 16 + 8, 11 * 16 + 8, 8, 8, x * 16 + 8, y * 16 + 8, 8, 8);

          const swMask = getTerrainMaskSouthWest(map, x, y, TerrainType.Ocean);
          context2d.drawImage(ter257, (swMask ^ 0b111) * 16, 11 * 16 + 8, 8, 8, x * 16, y * 16 + 8, 8, 8);

          // Check for river outlets
          if (getTileAt(map, x, y - 1).terrain === TerrainType.River) {
            context2d.drawImage(ter257, 8 * 16, 11 * 16, 16, 16, x * 16, y * 16, 16, 16);
          }
          if (getTileAt(map, x + 1, y).terrain === TerrainType.River) {
            context2d.drawImage(ter257, 9 * 16, 11 * 16, 16, 16, x * 16, y * 16, 16, 16);
          }
          if (getTileAt(map, x, y + 1).terrain === TerrainType.River) {
            context2d.drawImage(ter257, 10 * 16, 11 * 16, 16, 16, x * 16, y * 16, 16, 16);
          }
          if (getTileAt(map, x - 1, y).terrain === TerrainType.River) {
            context2d.drawImage(ter257, 11 * 16, 11 * 16, 16, 16, x * 16, y * 16, 16, 16);
          }
          break;
        }

        case TerrainType.Void:
          context2d.fillRect(x * 16, y * 16, 16, 16);
          break;

        default: {
          // First draw base grass background, then add terrain specific overlay
          context2d.drawImage(sp257, 0, 4 * 16, 16, 16, x * 16, y * 16, 16, 16);

          const terrainMask = getTerrainMaskCross(map, x, y, tile.terrain);
          const row = terrainSpriteMapIndex[tile.terrain];
          context2d.drawImage(ter257, terrainMask * 16, row * 16, 16, 16, x * 16, y * 16, 16, 16);
          break;
        }
      }
    }
  }
};
