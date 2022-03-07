import { getImageAsset, ImageAssetKey } from './assets';
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
  TerrainId,
} from './map';
import { palette } from './palette';
import { RenderViewport } from './types';

const terrainSpriteMapIndex = {
  [TerrainId.Desert]: 0,
  [TerrainId.Plains]: 1,
  [TerrainId.Grassland]: 2,
  [TerrainId.Forest]: 3,
  [TerrainId.Hills]: 4,
  [TerrainId.Mountains]: 5,
  [TerrainId.Tundra]: 6,
  [TerrainId.Arctic]: 7,
  [TerrainId.Swamp]: 8,
  [TerrainId.Jungle]: 9,
};

const canvas: HTMLCanvasElement = document.querySelector('#game-canvas');
const screenCtx = canvas.getContext('2d');
const unitSpriteSheet = document.createElement('canvas').getContext('2d');

//canvas.parentNode.append(fontsSpriteSheet.canvas);

export const generateSpriteSheets = (playerColors: [number, number, number][]) => {
  const sp257 = getImageAsset('sp257.pic.gif').canvas;

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

    unitSpriteSheet.putImageData(imageData, 0, index * bHeight);
  });
};

export const renderSprite = (
  asset: ImageAssetKey,
  sx: number,
  sy: number,
  dx: number,
  dy: number,
  width: number,
  height: number
) => {
  const spriteContext = getImageAsset(asset);
  screenCtx.drawImage(spriteContext.canvas, sx, sy, width, height, dx, dy, width, height);
};

export const renderMap = (map: GameMap, viewport: RenderViewport) => {
  const ter257 = getImageAsset('ter257.pic.gif').canvas;
  const sp257 = getImageAsset('sp257.pic.gif').canvas;

  for (let x = viewport.x; x < viewport.x + viewport.width; x++) {
    for (let y = viewport.y; y < viewport.y + viewport.height; y++) {
      const tile = getTileAt(map, x, y);
      const screenX = viewport.screenX + (x - viewport.x) * 16;
      const screenY = viewport.screenY + (y - viewport.y) * 16;

      if (tile.hidden) {
        screenCtx.fillRect(screenX, screenY, 16, 16);
        continue;
      }

      switch (tile.terrain) {
        // Rivers are a special case because they also connect to ocean tiles
        case TerrainId.River: {
          screenCtx.drawImage(sp257, 0, 4 * 16, 16, 16, screenX, screenY, 16, 16);

          const riverMask = getTerrainMaskCross(map, x, y, TerrainId.River);
          const oceanMask = getTerrainMaskCross(map, x, y, TerrainId.Ocean);
          screenCtx.drawImage(sp257, (riverMask | oceanMask) * 16, 4 * 16, 16, 16, screenX, screenY, 16, 16);
          break;
        }

        // Ocean tiles are split up in 4 8x8 tiles, one for each corner of the 16x16 tile
        case TerrainId.Ocean: {
          const nwMask = getTerrainMaskNorthWest(map, x, y, TerrainId.Ocean);
          screenCtx.drawImage(ter257, (nwMask ^ 0b111) * 16, 11 * 16, 8, 8, screenX, screenY, 8, 8);

          const neMask = getTerrainMaskNorthEast(map, x, y, TerrainId.Ocean);
          screenCtx.drawImage(ter257, (neMask ^ 0b111) * 16 + 8, 11 * 16, 8, 8, screenX + 8, screenY, 8, 8);

          const seMask = getTerrainMaskSouthEast(map, x, y, TerrainId.Ocean);
          screenCtx.drawImage(ter257, (seMask ^ 0b111) * 16 + 8, 11 * 16 + 8, 8, 8, screenX + 8, screenY + 8, 8, 8);

          const swMask = getTerrainMaskSouthWest(map, x, y, TerrainId.Ocean);
          screenCtx.drawImage(ter257, (swMask ^ 0b111) * 16, 11 * 16 + 8, 8, 8, screenX, screenY + 8, 8, 8);

          // Check for river outlets
          if (getTileAt(map, x, y - 1).terrain === TerrainId.River) {
            screenCtx.drawImage(ter257, 8 * 16, 11 * 16, 16, 16, screenX, screenY, 16, 16);
          }
          if (getTileAt(map, x + 1, y).terrain === TerrainId.River) {
            screenCtx.drawImage(ter257, 9 * 16, 11 * 16, 16, 16, screenX, screenY, 16, 16);
          }
          if (getTileAt(map, x, y + 1).terrain === TerrainId.River) {
            screenCtx.drawImage(ter257, 10 * 16, 11 * 16, 16, 16, screenX, screenY, 16, 16);
          }
          if (getTileAt(map, x - 1, y).terrain === TerrainId.River) {
            screenCtx.drawImage(ter257, 11 * 16, 11 * 16, 16, 16, screenX, screenY, 16, 16);
          }

          if (tile.specialResource) {
            screenCtx.drawImage(sp257, 10 * 16 + 1, 7 * 16 + 1, 15, 15, screenX, screenY, 15, 15);
          }
          break;
        }

        case TerrainId.Void:
          screenCtx.fillRect(screenX, screenY, 16, 16);
          break;

        default: {
          // First draw base grass background, then add TerrainId.specific overlay
          screenCtx.drawImage(sp257, 0, 4 * 16, 16, 16, screenX, screenY, 16, 16);

          const terrainMask = getTerrainMaskCross(map, x, y, tile.terrain);
          const terrainOffset = terrainSpriteMapIndex[tile.terrain];
          screenCtx.drawImage(ter257, terrainMask * 16, terrainOffset * 16, 16, 16, screenX, screenY, 16, 16);

          if (tile.terrain === TerrainId.Grassland && tile.extraShield) {
            screenCtx.drawImage(sp257, 9 * 16 + 8 + 1, 2 * 16 + 8 + 1, 7, 7, screenX + 4, screenY + 4, 7, 7);
          } else if (tile.specialResource) {
            screenCtx.drawImage(sp257, terrainOffset * 16 + 1, 7 * 16 + 1, 15, 15, screenX, screenY, 15, 15);
          }
          break;
        }
      }

      // Render the disolve edge near hidden tiles
      if (getTileAt(map, x, y - 1).hidden) {
        screenCtx.drawImage(sp257, 5 * 16, 8 * 16, 16, 16, screenX, screenY, 16, 16);
      }
      if (getTileAt(map, x + 1, y).hidden) {
        screenCtx.drawImage(sp257, 6 * 16, 8 * 16, 16, 16, screenX, screenY, 16, 16);
      }
      if (getTileAt(map, x, y + 1).hidden) {
        screenCtx.drawImage(sp257, 7 * 16, 8 * 16, 16, 16, screenX, screenY, 16, 16);
      }
      if (getTileAt(map, x - 1, y).hidden) {
        screenCtx.drawImage(sp257, 8 * 16, 8 * 16, 16, 16, screenX, screenY, 16, 16);
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
        screenCtx.drawImage(
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

export const setFontColor = (font: Font, color: [number, number, number]) => {
  const fontsCv = getImageAsset('fonts.cv.png');
  const offset = font.offset;
  const [r, g, b] = color;

  const fontImageData = fontsCv.getImageData(0, offset, 32 * font.width, 3 * font.height);
  const { data } = fontImageData;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
  fontsCv.putImageData(fontImageData, 0, offset);
};

export const renderText = (font: Font, text: string, x: number, y: number): number => {
  const fontsCv = getImageAsset('fonts.cv.png');
  const { width, height, offset, kerning } = font;

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    screenCtx.drawImage(
      fontsCv.canvas,
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
  return x;
};

const renderBorder = (destination: ImageData) => {
  const { width, height } = destination;
  const dstData = destination.data;
  let topRowIndex = 0;
  let bottomRowIndex = (height - 1) * width * 4;

  for (let dx = 0; dx < width; dx++) {
    dstData[topRowIndex++] = palette.darkGray[0];
    dstData[topRowIndex++] = palette.darkGray[1];
    dstData[topRowIndex++] = palette.darkGray[2];
    dstData[topRowIndex++] = 255;
    dstData[bottomRowIndex++] = palette.white[0];
    dstData[bottomRowIndex++] = palette.white[1];
    dstData[bottomRowIndex++] = palette.white[2];
    dstData[bottomRowIndex++] = 255;
  }

  let leftColumnIndex = width * 4;
  let rightColumnIndex = (width - 1) * 4;
  const increment = (width - 1) * 4;

  for (let dy = 1; dy < height; dy++) {
    dstData[leftColumnIndex++] = palette.white[0];
    dstData[leftColumnIndex++] = palette.white[1];
    dstData[leftColumnIndex++] = palette.white[2];
    dstData[leftColumnIndex++] = 255;

    dstData[rightColumnIndex++] = palette.darkGray[0];
    dstData[rightColumnIndex++] = palette.darkGray[1];
    dstData[rightColumnIndex++] = palette.darkGray[2];
    dstData[rightColumnIndex++] = 255;
    leftColumnIndex += increment;
    rightColumnIndex += increment;
  }
};

export const renderWindow = (x: number, y: number, width: number, height: number, color: [number, number, number]) => {
  const [r, g, b] = color;
  const dst = screenCtx.getImageData(x, y, width, height);
  for (let i = width; i < dst.data.length - width; i += 4) {
    dst[i] = r;
    dst[i + 1] = g;
    dst[i + 2] = b;
    dst[i + 3] = 255;
  }

  renderBorder(dst);
  screenCtx.putImageData(dst, x, y);
};

export const renderGrayBox = (x: number, y: number, width: number, height: number) => {
  const sp257 = getImageAsset('sp257.pic.gif');

  const srcData = sp257.getImageData(18 * 16, 11 * 16, 32, 16).data;
  const dst = screenCtx.getImageData(x, y, width, height);
  const dstData = dst.data;

  for (let dx = 1; dx < width - 1; dx++) {
    for (let dy = 1; dy < height - 1; dy++) {
      const dstIndex = (dx + dy * width) * 4;
      const srcIndex = ((dx % 32) + (dy % 16) * 32) * 4;
      dstData[dstIndex] = srcData[srcIndex];
      dstData[dstIndex + 1] = srcData[srcIndex + 1];
      dstData[dstIndex + 2] = srcData[srcIndex + 2];
      dstData[dstIndex + 3] = 255;
    }
  }

  renderBorder(dst);
  screenCtx.putImageData(dst, x, y);
};
