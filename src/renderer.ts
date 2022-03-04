import { loadImage, loadJson } from "./assets";
import {
  GameMap,
  generateMapFromTemplate,
  getTerrainMaskCross,
  getTerrainMaskNorthEast,
  getTerrainMaskNorthWest,
  getTerrainMaskSouthEast,
  getTerrainMaskSouthWest,
  getTileAt,
  MapDirectionBit,
  MapTemplate,
  TerrainType,
} from "./map";

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

      const bitmask = getTerrainMaskCross(map, x, y, tile.terrain);

      if (tile.terrain === TerrainType.Ocean) {
        // Ocean tiles are split up in 4 8x8 tiles, one for each corner of the 16x16 tile
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
      } else {
        context2d.drawImage(sp257, 0, 4 * 16, 16, 16, x * 16, y * 16, 16, 16);
      }

      switch (tile.terrain) {
        case TerrainType.River: {
          const oceanmask = getTerrainMaskCross(map, x, y, TerrainType.Ocean);
          context2d.drawImage(sp257, (bitmask | oceanmask) * 16, 4 * 16, 16, 16, x * 16, y * 16, 16, 16);
          break;
        }

        case TerrainType.Desert:
          context2d.drawImage(ter257, bitmask * 16, 0 * 16, 16, 16, x * 16, y * 16, 16, 16);
          break;

        case TerrainType.Plains:
          context2d.drawImage(ter257, bitmask * 16, 1 * 16, 16, 16, x * 16, y * 16, 16, 16);
          break;

        case TerrainType.Grassland:
          context2d.drawImage(ter257, bitmask * 16, 2 * 16, 16, 16, x * 16, y * 16, 16, 16);
          break;

        case TerrainType.Forest:
          context2d.drawImage(ter257, bitmask * 16, 3 * 16, 16, 16, x * 16, y * 16, 16, 16);
          break;

        case TerrainType.Hills:
          context2d.drawImage(ter257, bitmask * 16, 4 * 16, 16, 16, x * 16, y * 16, 16, 16);
          break;

        case TerrainType.Mountains:
          context2d.drawImage(ter257, bitmask * 16, 5 * 16, 16, 16, x * 16, y * 16, 16, 16);
          break;

        case TerrainType.Tundra:
          context2d.drawImage(ter257, bitmask * 16, 6 * 16, 16, 16, x * 16, y * 16, 16, 16);
          break;

        case TerrainType.Arctic:
          context2d.drawImage(ter257, bitmask * 16, 7 * 16, 16, 16, x * 16, y * 16, 16, 16);
          break;

        case TerrainType.Swamp:
          context2d.drawImage(ter257, bitmask * 16, 8 * 16, 16, 16, x * 16, y * 16, 16, 16);
          break;

        case TerrainType.Jungle:
          context2d.drawImage(ter257, bitmask * 16, 9 * 16, 16, 16, x * 16, y * 16, 16, 16);
          break;
      }
    }
  }
};
