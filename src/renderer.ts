import { getImageAsset } from './assets';
import { Font, fonts } from './fonts';
import { GameState } from './game-state';
import {
  GameMap,
  getTerrainMaskCross,
  getTerrainMaskNorthEast,
  getTerrainMaskNorthWest,
  getTerrainMaskSouthEast,
  getTerrainMaskSouthWest,
  getTileAt,
  Terrain,
} from './map';
import { RenderViewport } from './types';

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

const canvas: HTMLCanvasElement = document.querySelector('#game-canvas');
const context2d = canvas.getContext('2d');
const unitSpriteSheet = document.createElement('canvas').getContext('2d');
const fontsSpriteSheet = document.createElement('canvas').getContext('2d');

canvas.parentNode.append(fontsSpriteSheet.canvas);

export const generateSpriteSheets = (playerColors: [number, number, number][]) => {
  const sp257 = getImageAsset('sp257.pic.gif');

  // Dimensions of the units block in sp257.pic
  const bWidth = 20 * 16;
  const bHeight = 2 * 16;

  unitSpriteSheet.canvas.width = bWidth;
  unitSpriteSheet.canvas.height = bHeight * playerColors.length;

  playerColors.forEach((color, index) => {
    unitSpriteSheet.drawImage(sp257, 0, 10 * 16, bWidth, bHeight, 0, index * bHeight, bWidth, bHeight);

    const imageData = unitSpriteSheet.getImageData(0, index * bHeight, bWidth, bHeight);
    const { data } = imageData;

    for (let x = 0; x < bWidth; x++) {
      for (let y = 0; y < bHeight; y++) {
        const i = x * 4 + y * bWidth * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Remove border
        if (r === 0 && g === 170 && b === 170 && (y % 16 === 0 || x % 16 === 0)) {
          data[i] = 0;
          data[i + 1] = 0;
          data[i + 2] = 0;
          data[i + 3] = 0;
          continue;
        }

        // Replace primary color
        if (r === 97 && g === 227 && b === 101) {
          data[i] = color[0];
          data[i + 1] = color[1];
          data[i + 2] = color[2];
        }

        // Replace secondary color
        if (r === 44 && g === 121 && b === 0) {
          data[i] = color[0] >> 1;
          data[i + 1] = color[1] >> 1;
          data[i + 2] = color[2] >> 1;
        }
      }
    }

    // copy font from image to a canvas so we can manipulate color
    const fontsCv = getImageAsset('fonts.cv.png');
    fontsSpriteSheet.canvas.width = fontsCv.width;
    fontsSpriteSheet.canvas.height = fontsCv.height;
    fontsSpriteSheet.drawImage(fontsCv, 0, 0);

    unitSpriteSheet.putImageData(imageData, 0, index * bHeight);
  });
};

export const renderMap = (map: GameMap, viewport: RenderViewport) => {
  const ter257 = getImageAsset('ter257.pic.gif');
  const sp257 = getImageAsset('sp257.pic.gif');

  for (let x = viewport.x; x < viewport.x + viewport.width; x++) {
    for (let y = viewport.y; y < viewport.y + viewport.height; y++) {
      const tile = getTileAt(map, x, y);
      const screenX = viewport.screenX + (x - viewport.x) * 16;
      const screenY = viewport.screenY + (y - viewport.y) * 16;

      if (tile.hidden) {
        context2d.fillRect(screenX, screenY, 16, 16);
        continue;
      }

      switch (tile.terrain) {
        // Rivers are a special case because they also connect to ocean tiles
        case Terrain.River: {
          context2d.drawImage(sp257, 0, 4 * 16, 16, 16, screenX, screenY, 16, 16);

          const riverMask = getTerrainMaskCross(map, x, y, Terrain.River);
          const oceanMask = getTerrainMaskCross(map, x, y, Terrain.Ocean);
          context2d.drawImage(sp257, (riverMask | oceanMask) * 16, 4 * 16, 16, 16, screenX, screenY, 16, 16);
          break;
        }

        // Ocean tiles are split up in 4 8x8 tiles, one for each corner of the 16x16 tile
        case Terrain.Ocean: {
          const nwMask = getTerrainMaskNorthWest(map, x, y, Terrain.Ocean);
          context2d.drawImage(ter257, (nwMask ^ 0b111) * 16, 11 * 16, 8, 8, screenX, screenY, 8, 8);

          const neMask = getTerrainMaskNorthEast(map, x, y, Terrain.Ocean);
          context2d.drawImage(ter257, (neMask ^ 0b111) * 16 + 8, 11 * 16, 8, 8, screenX + 8, screenY, 8, 8);

          const seMask = getTerrainMaskSouthEast(map, x, y, Terrain.Ocean);
          context2d.drawImage(ter257, (seMask ^ 0b111) * 16 + 8, 11 * 16 + 8, 8, 8, screenX + 8, screenY + 8, 8, 8);

          const swMask = getTerrainMaskSouthWest(map, x, y, Terrain.Ocean);
          context2d.drawImage(ter257, (swMask ^ 0b111) * 16, 11 * 16 + 8, 8, 8, screenX, screenY + 8, 8, 8);

          // Check for river outlets
          if (getTileAt(map, x, y - 1).terrain === Terrain.River) {
            context2d.drawImage(ter257, 8 * 16, 11 * 16, 16, 16, screenX, screenY, 16, 16);
          }
          if (getTileAt(map, x + 1, y).terrain === Terrain.River) {
            context2d.drawImage(ter257, 9 * 16, 11 * 16, 16, 16, screenX, screenY, 16, 16);
          }
          if (getTileAt(map, x, y + 1).terrain === Terrain.River) {
            context2d.drawImage(ter257, 10 * 16, 11 * 16, 16, 16, screenX, screenY, 16, 16);
          }
          if (getTileAt(map, x - 1, y).terrain === Terrain.River) {
            context2d.drawImage(ter257, 11 * 16, 11 * 16, 16, 16, screenX, screenY, 16, 16);
          }

          if (tile.specialResource) {
            context2d.drawImage(sp257, 10 * 16 + 1, 7 * 16 + 1, 15, 15, screenX, screenY, 15, 15);
          }
          break;
        }

        case Terrain.Void:
          context2d.fillRect(screenX, screenY, 16, 16);
          break;

        default: {
          // First draw base grass background, then add terrain specific overlay
          context2d.drawImage(sp257, 0, 4 * 16, 16, 16, screenX, screenY, 16, 16);

          const terrainMask = getTerrainMaskCross(map, x, y, tile.terrain);
          const terrainOffset = terrainSpriteMapIndex[tile.terrain];
          context2d.drawImage(ter257, terrainMask * 16, terrainOffset * 16, 16, 16, screenX, screenY, 16, 16);

          if (tile.terrain === Terrain.Grassland && tile.extraShield) {
            context2d.drawImage(sp257, 9 * 16 + 8 + 1, 2 * 16 + 8 + 1, 7, 7, screenX + 4, screenY + 4, 7, 7);
          } else if (tile.specialResource) {
            context2d.drawImage(sp257, terrainOffset * 16 + 1, 7 * 16 + 1, 15, 15, screenX, screenY, 15, 15);
          }
          break;
        }
      }

      // Render the disolve edge near hidden tiles
      if (getTileAt(map, x, y - 1).hidden) {
        context2d.drawImage(sp257, 5 * 16, 8 * 16, 16, 16, screenX, screenY, 16, 16);
      }
      if (getTileAt(map, x + 1, y).hidden) {
        context2d.drawImage(sp257, 6 * 16, 8 * 16, 16, 16, screenX, screenY, 16, 16);
      }
      if (getTileAt(map, x, y + 1).hidden) {
        context2d.drawImage(sp257, 7 * 16, 8 * 16, 16, 16, screenX, screenY, 16, 16);
      }
      if (getTileAt(map, x - 1, y).hidden) {
        context2d.drawImage(sp257, 8 * 16, 8 * 16, 16, 16, screenX, screenY, 16, 16);
      }
    }
  }
};

export const renderWorld = (state: GameState, viewport: RenderViewport, renderSelected: boolean) => {
  renderMap(state.players[0].map, viewport);

  const mapWidth = state.masterMap.width;

  // Render players
  for (let pi = 0; pi < state.players.length; pi++) {
    const player = state.players[pi];
    const selectedUnit = player.units[player.selectedUnit];

    // Render units
    for (const unit of player.units) {
      if (unit !== selectedUnit || renderSelected) {
        context2d.drawImage(
          unitSpriteSheet.canvas,
          unit.prototypeId * 16,
          pi * 16 * 2,
          16,
          16,
          viewport.screenX +
            unit.screenOffsetX +
            Math.max(unit.x - viewport.x, (unit.x - viewport.x + mapWidth) % mapWidth) * 16,
          viewport.screenY + unit.screenOffsetY + (unit.y - viewport.y) * 16,
          16,
          16
        );
      }
    }
  }
};

export const renderText = (font: Font, text: string, x: number, y: number, color: [number, number, number]) => {
  const { width, height, kerning, offset } = font;

  const [r, g, b] = color;
  const fontImageData = fontsSpriteSheet.getImageData(0, offset, 32 * font.width, 3 * font.height);
  const { data } = fontImageData;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
  fontsSpriteSheet.putImageData(fontImageData, 0, offset);

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    context2d.drawImage(
      fontsSpriteSheet.canvas,
      (code % 32) * width,
      offset + ((code >> 5) - 1) * height,
      width,
      height,
      x,
      y,
      width,
      height
    );
    x += kerning[code - 32] + 1;
  }
};
