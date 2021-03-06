import { getImageAsset, Sprite } from './assets';
import { Font, fonts, measureText } from './fonts';
import { Rect, direction8 } from './helpers';
import { Citizens, City, Happiness } from './logic/city';
import { GameState } from './logic/game-state';
import {
  GameMap,
  getTerrainMaskCross,
  getTerrainMaskNorthEast,
  getTerrainMaskNorthWest,
  getTerrainMaskSouthEast,
  getTerrainMaskSouthWest,
  getTileAt,
  getTilesAround,
  MapTile,
  TerrainId,
  TerrainYield,
} from './logic/map';
import { Unit, UnitPrototypeId, unitSpriteSheetOffsetMap, UnitState } from './logic/units';
import { palette } from './palette';

export enum YieldIcon {
  Food = 0,
  Shield = 1,
  Trade = 2,
  Coin = 3,
  Beaker = 4,
  Void = 5,
  Luxury = 6,
}

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

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
const screenCtx = canvas?.getContext('2d');
const centerRoadImageData = new ImageData(
  new Uint8ClampedArray([...palette.brown, 255, ...palette.brown, 255, ...palette.brown, 255, ...palette.brown, 255]),
  2,
  2
);
const unitContext = document.createElement('canvas').getContext('2d');
const altSp257Context = document.createElement('canvas').getContext('2d');

if (!canvas || !screenCtx || !unitContext || !altSp257Context) {
  throw new Error('Failed to initialize renderer');
}

let fontsImageData = new ImageData(1, 1);

const drawHorizontalLine = (dst: ImageData, x: number, y: number, length: number, color: [number, number, number]) => {
  const data = dst.data;
  const [r, g, b] = color;
  const start = (x + y * dst.width) * 4;
  const end = start + length * 4;
  for (let i = start; i < end; i += 4) {
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = 255;
  }
};

const drawVerticalLine = (dst: ImageData, x: number, y: number, length: number, color: [number, number, number]) => {
  const data = dst.data;
  const increment = dst.width * 4;
  const [r, g, b] = color;
  const start = (x + y * dst.width) * 4;
  const end = start + length * increment;
  for (let i = start; i < end; i += increment) {
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = 255;
  }
};

const drawFrame = (
  dst: ImageData,
  x: number,
  y: number,
  width: number,
  height: number,
  color: [number, number, number]
) => {
  drawHorizontalLine(dst, x, y, width, color);
  drawHorizontalLine(dst, x, y + height - 1, width, color);
  drawVerticalLine(dst, x, y + 1, height - 2, color);
  drawVerticalLine(dst, x + width - 1, y + 1, height - 2, color);
};

const fillSolid = (
  dst: ImageData,
  color: [number, number, number],
  x: number,
  y: number,
  width: number,
  height: number
) => {
  const [r, g, b] = color;
  const dstData = dst.data;

  for (let dx = x; dx < x + width; dx++) {
    for (let dy = y; dy < y + height; dy++) {
      const dstIndex = (dx + dy * dst.width) * 4;
      dstData[dstIndex] = r;
      dstData[dstIndex + 1] = g;
      dstData[dstIndex + 2] = b;
      dstData[dstIndex + 3] = 255;
    }
  }
};

const fillPattern = (dst: ImageData, pattern: ImageData, x: number, y: number, width: number, height: number) => {
  const patternData = pattern.data;
  const dstData = dst.data;

  for (let dy = y; dy < y + height; dy++) {
    const srcLineIndex = ((dy - y) % pattern.height) * pattern.width;
    for (let dx = x; dx < x + width; dx++) {
      const dstIndex = (dx + dy * dst.width) * 4;
      const srcIndex = ((dx % pattern.width) + srcLineIndex) * 4;
      if (patternData[srcIndex + 3] > 0) {
        dstData[dstIndex] = patternData[srcIndex];
        dstData[dstIndex + 1] = patternData[srcIndex + 1];
        dstData[dstIndex + 2] = patternData[srcIndex + 2];
        dstData[dstIndex + 3] = 255;
      }
    }
  }
};

const replaceColor = (
  dst: ImageData,
  x: number,
  y: number,
  width: number,
  height: number,
  colorFrom: [number, number, number],
  colorTo: [number, number, number]
) => {
  const data = dst.data;
  const [rFrom, gFrom, bFrom] = colorFrom;
  const [rTo, gTo, bTo] = colorTo;

  for (let dx = x; dx < x + width; dx++) {
    for (let dy = y; dy < y + height; dy++) {
      const i = (dx + dy * dst.width) * 4;
      if (data[i] === rFrom && data[i + 1] === gFrom && data[i + 2] === bFrom) {
        data[i] = rTo;
        data[i + 1] = gTo;
        data[i + 2] = bTo;
      }
    }
  }
};

const fillColorAndCopy = (
  src: ImageData,
  dst: ImageData,
  sx: number,
  sy: number,
  width: number,
  height: number,
  dx: number,
  dy: number,
  color: [number, number, number]
) => {
  const srcData = src.data;
  const dstData = dst.data;
  const [r, g, b] = color;

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const si = (x + sx + (y + sy) * src.width) * 4;
      const di = (x + dx + (y + dy) * dst.width) * 4;
      if (srcData[si + 3] > 0) {
        dstData[di] = r;
        dstData[di + 1] = g;
        dstData[di + 2] = b;
      }
    }
  }
};

export const initialize = (
  colors: {
    primaryColor: [number, number, number];
    secondaryColor: [number, number, number];
  }[]
) => {
  const sp257 = getImageAsset('sp257.pic.png');

  // Dimensions of the units block in sp257.pic
  const bWidth = 20 * 16;
  const bHeight = 2 * 16;

  unitContext.canvas.width = bWidth;
  unitContext.canvas.height = bHeight * colors.length;

  colors.forEach((color, index) => {
    unitContext.drawImage(sp257.canvas, 0, 10 * 16, bWidth, bHeight, 0, index * bHeight, bWidth, bHeight);

    const imageData = unitContext.getImageData(0, index * bHeight, bWidth, bHeight);
    const { data } = imageData;

    const [pr, pg, pb] = color.primaryColor;
    const [sr, sg, sb] = color.secondaryColor;

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
          data[i] = pr;
          data[i + 1] = pg;
          data[i + 2] = pb;
        }

        // Replace secondary color
        if (r === 44 && g === 121 && b === 0) {
          data[i] = sr;
          data[i + 1] = sg;
          data[i + 2] = sb;
        }
      }
    }

    unitContext.putImageData(imageData, 0, index * bHeight);
  });

  // Draw alternative versions of sprites in sp257 on a seperate offscreen context
  const imageData = sp257.getImageData(0, 0, sp257.canvas.width, sp257.canvas.height);

  altSp257Context.canvas.width = imageData.width;
  altSp257Context.canvas.height = imageData.height;

  // replace white with black for "negative" yield icons
  replaceColor(imageData, 8 * 16, 2 * 16, 3 * 8, 8, palette.white, palette.black);

  // replace yellow with red for sell button
  replaceColor(imageData, 9 * 16 + 8, 2 * 16, 8, 8, palette.yellow, palette.red);

  // replace gray background with cyan for "selection" background
  replaceColor(imageData, 18 * 16, 11 * 16, 32, 16, palette.grayLight, palette.cyanDark);
  replaceColor(imageData, 18 * 16, 11 * 16, 32, 16, palette.grayLighter, palette.cyan);

  altSp257Context.putImageData(imageData, 0, 0);

  const fonts = getImageAsset('fonts.cv.png');
  fontsImageData = fonts.getImageData(0, 0, fonts.canvas.width, fonts.canvas.height);
};

export const renderSprite = (sprite: Sprite, dx: number, dy: number) => {
  const spriteContext = getImageAsset(sprite.asset);
  screenCtx.drawImage(
    spriteContext.canvas,
    sprite.x,
    sprite.y,
    sprite.width,
    sprite.height,
    dx,
    dy,
    sprite.width,
    sprite.height
  );
};

export const renderTileRoads = (
  sp257: CanvasImageSource,
  map: GameMap,
  tile: MapTile,
  x: number,
  y: number,
  screenX: number,
  screenY: number
) => {
  let drawn = false;
  const tiles = getTilesAround(map, x, y);

  for (let i = 0; i < tiles.length; i++) {
    const neighbor = tiles[i];
    if (tile.hasRailroad && neighbor.hasRailroad) {
      screenCtx.drawImage(
        sp257,
        (i + 8) * 16,
        6 * 16,
        16,
        16,
        screenX + direction8[i][0],
        screenY + direction8[i][1],
        16,
        16
      );
      drawn = true;
    } else if (neighbor.hasRoad) {
      screenCtx.drawImage(sp257, i * 16, 3 * 16, 16, 16, screenX, screenY, 16, 16);
      drawn = true;
    }
  }

  if (!drawn) {
    // Paint center 2x2 road colored if only this tile has road
    screenCtx.putImageData(centerRoadImageData, screenX + 7, screenY + 7);
  }
};

export const renderTileTerrain = (
  ter257: CanvasImageSource,
  sp257: CanvasImageSource,
  map: GameMap,
  x: number,
  y: number,
  screenX: number,
  screenY: number,
  hideIrrigation?: boolean
) => {
  const tile = getTileAt(map, x, y);
  if (tile.hidden || tile.terrain === TerrainId.Void) {
    screenCtx.fillRect(screenX, screenY, 16, 16);
    return;
  }
  switch (tile.terrain) {
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

    default: {
      // First draw base grass background, then add TerrainId.specific overlay
      screenCtx.drawImage(sp257, 0, 4 * 16, 16, 16, screenX, screenY, 16, 16);

      if (tile.hasIrrigation && !hideIrrigation) {
        screenCtx.drawImage(sp257, 4 * 16, 2 * 16, 16, 16, screenX, screenY, 16, 16);
      }

      let terrainMask = getTerrainMaskCross(map, x, y, tile.terrain);

      // Rivers are a special case because they also connect to ocean tiles - and are on a different sprite sheet
      if (tile.terrain === TerrainId.River) {
        terrainMask |= getTerrainMaskCross(map, x, y, TerrainId.Ocean);
        screenCtx.drawImage(sp257, terrainMask * 16, 4 * 16, 16, 16, screenX, screenY, 16, 16);
        break;
      }

      const terrainOffset = terrainSpriteMapIndex[tile.terrain];
      screenCtx.drawImage(ter257, terrainMask * 16, terrainOffset * 16, 16, 16, screenX, screenY, 16, 16);

      if (tile.hasMine) {
        screenCtx.drawImage(sp257, 5 * 16, 2 * 16, 16, 16, screenX, screenY, 16, 16);
      }

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

  if (tile.hasRoad) {
    renderTileRoads(sp257, map, tile, x, y, screenX, screenY);
  }
};

const renderUnitLetter = (letter: string, screenX: number, screenY: number) => {
  renderText(fonts.main, letter, screenX + 8, screenY + 8, palette.black, true);
  renderText(fonts.main, letter, screenX + 8, screenY + 7, palette.white, true);
};

export const renderUnitPrototype = (
  prototypeId: UnitPrototypeId,
  owner: number,
  screenX: number,
  screenY: number,
  stacked?: boolean
) => {
  const unitOffset = unitSpriteSheetOffsetMap[prototypeId] * 16;
  const ownerOffset = owner * 16 * 2;
  if (stacked) {
    screenCtx.drawImage(unitContext.canvas, unitOffset, ownerOffset, 16, 16, screenX, screenY, 16, 16);
  }
  screenCtx.drawImage(unitContext.canvas, unitOffset, ownerOffset, 16, 16, screenX - 1, screenY - 1, 16, 16);
};

export const renderUnit = (
  sp257: CanvasImageSource,
  unit: Unit,
  screenX: number,
  screenY: number,
  stacked?: boolean
) => {
  renderUnitPrototype(unit.prototypeId, unit.owner, screenX, screenY, stacked);

  // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
  switch (unit.state) {
    case UnitState.Fortified:
      screenCtx.drawImage(sp257, 13 * 16 + 1, 7 * 16 + 1, 15, 15, screenX, screenY, 15, 15);
      break;
    case UnitState.Fortifying:
      renderUnitLetter('F', screenX, screenY);
      break;
    case UnitState.Clearing:
    case UnitState.BuildingIrrigation:
      renderUnitLetter('I', screenX, screenY);
      break;
    case UnitState.BuildingMine:
      renderUnitLetter('M', screenX, screenY);
      break;
    case UnitState.BuildingRoad:
      renderUnitLetter('R', screenX, screenY);
      break;
  }
};

export const renderCity = (
  sp257: CanvasRenderingContext2D,
  city: City,
  screenX: number,
  screenY: number,
  primaryColor: [number, number, number],
  secondaryColor: [number, number, number],
  containsUnits?: boolean
) => {
  const imageData = sp257.getImageData(12 * 16, 7 * 16, 16, 16);
  const data = imageData.data;

  const [pRed, pGreen, pBlue] = primaryColor;
  const [sRed, sGreen, sBlue] = secondaryColor;

  // TODO: this can be optimized a lot
  let i = 0;
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      if (y === 0 || y === 15 || x === 0 || x === 15) {
        // Border
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 255;
      } else if (data[i + 3] === 0) {
        data[i] = pRed;
        data[i + 1] = pGreen;
        data[i + 2] = pBlue;
        data[i + 3] = 255;
      } else {
        data[i] = sRed;
        data[i + 1] = sGreen;
        data[i + 2] = sBlue;
      }
      i += 4;
    }
  }

  // Draw bevel
  drawHorizontalLine(imageData, 2, 1, 13, secondaryColor);
  drawHorizontalLine(imageData, 1, 14, 14, palette.white);
  drawVerticalLine(imageData, 1, 1, 13, palette.white);
  drawVerticalLine(imageData, 14, 2, 12, secondaryColor);

  if (containsUnits) {
    screenCtx.putImageData(imageData, screenX, screenY);
  } else {
    // Exclude black border if not containing units
    screenCtx.putImageData(imageData, screenX, screenY, 1, 1, 14, 14);
  }

  screenCtx.putImageData(imageData, screenX, screenY, 1, 1, 14, 14);

  if (city.isDisorder) {
    screenCtx.drawImage(sp257.canvas, Citizens.UnhappyMale * 8, 8 * 16, 8, 15, screenX + 5, screenY + 2, 8, 15);
  } else {
    renderText(fonts.main, city.size.toString(), screenX + 9, screenY + 5, palette.black, true);
  }
};

export const renderText = (
  font: Font,
  text: string,
  x: number,
  y: number,
  color: [number, number, number],
  center?: boolean
): number => {
  if (!text) {
    return x;
  }
  const { width, height, offset, kerning } = font;
  const textLength = measureText(font, text);

  if (center) {
    x -= Math.round(textLength / 2);
  }

  const imageData = screenCtx.getImageData(x, y, textLength, height);

  let offsetX = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    const charWidth = kerning[code - 32];

    fillColorAndCopy(
      fontsImageData,
      imageData,
      (code % 32) * width,
      offset + ((code >> 5) - 1) * height,
      charWidth,
      height,
      offsetX,
      0,
      color
    );
    offsetX += charWidth + 1;
  }

  screenCtx.putImageData(imageData, x, y);
  return x + offsetX;
};

export const renderTextLines = (
  font: Font,
  lines: (string | undefined)[],
  x: number,
  y: number,
  color: [number, number, number]
) => {
  for (let i = 0; i < lines.length; i++) {
    const text = lines[i];
    if (text !== undefined) {
      renderText(font, text, x, y, color);
      y += font.height;
    }
  }
};

const renderBorder = (destination: ImageData) => {
  const { width, height } = destination;
  const dstData = destination.data;
  let topRowIndex = 0;
  let bottomRowIndex = (height - 1) * width * 4;

  for (let dx = 0; dx < width - 1; dx++) {
    dstData[topRowIndex++] = palette.grayDark[0];
    dstData[topRowIndex++] = palette.grayDark[1];
    dstData[topRowIndex++] = palette.grayDark[2];
    dstData[topRowIndex++] = 255;
    dstData[bottomRowIndex++] = palette.white[0];
    dstData[bottomRowIndex++] = palette.white[1];
    dstData[bottomRowIndex++] = palette.white[2];
    dstData[bottomRowIndex++] = 255;
  }
  dstData[bottomRowIndex++] = palette.grayDark[0];
  dstData[bottomRowIndex++] = palette.grayDark[1];
  dstData[bottomRowIndex++] = palette.grayDark[2];
  dstData[bottomRowIndex++] = 255;

  let leftColumnIndex = width * 4;
  let rightColumnIndex = (width - 1) * 4;
  const increment = (width - 1) * 4;

  for (let dy = 1; dy < height; dy++) {
    dstData[leftColumnIndex++] = palette.white[0];
    dstData[leftColumnIndex++] = palette.white[1];
    dstData[leftColumnIndex++] = palette.white[2];
    dstData[leftColumnIndex++] = 255;

    dstData[rightColumnIndex++] = palette.grayDark[0];
    dstData[rightColumnIndex++] = palette.grayDark[1];
    dstData[rightColumnIndex++] = palette.grayDark[2];
    dstData[rightColumnIndex++] = 255;
    leftColumnIndex += increment;
    rightColumnIndex += increment;
  }
};

export const renderWindow = (x: number, y: number, width: number, height: number, color: [number, number, number]) => {
  const [r, g, b] = color;
  const dst = screenCtx.getImageData(x, y, width, height);
  const { data } = dst;

  for (let i = width * 4; i < dst.data.length - width; i += 4) {
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = 255;
  }

  renderBorder(dst);
  screenCtx.putImageData(dst, x, y);
};

export const renderMinimap = (
  state: GameState,
  playerIdx: number,
  screenArea: Rect,
  viewport: Rect,
  renderSelected: boolean
) => {
  const { x: screenX, y: screenY, width, height } = screenArea;
  const dst = screenCtx.getImageData(screenX, screenY, width, height);
  const { data } = dst;
  const player = state.players[playerIdx];
  const { map } = player;
  const offsetX = viewport.x - ((screenArea.width - viewport.width) >> 1);
  const offsetY = viewport.y - ((screenArea.height - viewport.height) >> 1);

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const i = x * 4 + y * width * 4;
      const tile = getTileAt(map, x + offsetX, y + offsetY);
      let color: [number, number, number];

      if (tile.hidden || tile.terrain === TerrainId.Void) {
        color = palette.black;
      } else if (tile.terrain === TerrainId.Ocean) {
        color = palette.blueDark;
      } else {
        color = palette.greenDark;
      }

      data[i] = color[0];
      data[i + 1] = color[1];
      data[i + 2] = color[2];
      data[i + 3] = 255;
    }
  }

  for (const player of state.players) {
    const [r, g, b] = player.civ.primaryColor;
    for (const city of player.cities) {
      const screenX = city.x - offsetX;
      const screenY = city.y - offsetY;

      const i = screenX * 4 + screenY * width * 4;

      if (i > -1 && i < data.length) {
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;
      }
    }
  }

  if (renderSelected && state.playerInTurn === playerIdx && player.selectedUnit !== undefined) {
    const unit = player.units[player.selectedUnit];
    const screenX = unit.x - offsetX;
    const screenY = unit.y - offsetY;

    const i = screenX * 4 + screenY * width * 4;

    if (i > -1 && i < data.length) {
      data[i] = palette.white[0];
      data[i + 1] = palette.white[1];
      data[i + 2] = palette.white[2];
      data[i + 3] = 255;
    }
  }

  drawFrame(
    dst,
    ((screenArea.width - viewport.width) >> 1) - 1,
    ((screenArea.height - viewport.height) >> 1) - 1,
    viewport.width + 2,
    viewport.height + 2,
    palette.white
  );

  renderBorder(dst);
  screenCtx.putImageData(dst, screenX, screenY);
};

export const renderGrayBox = (x: number, y: number, width: number, height: number) => {
  const sp257 = getImageAsset('sp257.pic.png');

  const pattern = sp257.getImageData(18 * 16, 11 * 16, 32, 16);
  const dst = screenCtx.getImageData(x, y, width, height);

  fillPattern(dst, pattern, 1, 1, width - 2, height - 2);

  renderBorder(dst);
  screenCtx.putImageData(dst, x, y);
};

export const renderGrayBoxWithBorder = (x: number, y: number, width: number, height: number) => {
  const sp257 = getImageAsset('sp257.pic.png');

  const pattern = sp257.getImageData(18 * 16, 11 * 16, 32, 16);
  const dst = screenCtx.getImageData(x, y, width, height);

  drawFrame(dst, 0, 0, width, height, palette.black);
  drawHorizontalLine(dst, 1, 1, width - 2, palette.grayDark);
  drawHorizontalLine(dst, 2, height - 2, width - 4, palette.white);
  drawVerticalLine(dst, 1, 2, height - 3, palette.white);
  drawVerticalLine(dst, width - 2, 2, height - 3, palette.grayDark);

  fillPattern(dst, pattern, 2, 2, width - 4, height - 4);

  screenCtx.putImageData(dst, x, y);
};

export const renderBlueBox = (
  x: number,
  y: number,
  width: number,
  height: number,
  margins: [number, number, number, number] = [1, 1, 1, 1]
) => {
  const sp299 = getImageAsset('sp299.pic.png');

  const pattern = sp299.getImageData(13 * 16, 6 * 16 + 4, 16, 16);
  const dst = screenCtx.getImageData(x, y, width, height);

  fillSolid(dst, palette.blueDark, 0, 0, width, height);
  fillPattern(dst, pattern, margins[3], margins[0], width - margins[1] - margins[3], height - margins[0] - margins[2]);

  screenCtx.putImageData(dst, x, y);
};

export const renderSmallButton = (
  label: string,
  x: number,
  y: number,
  width: number,
  primaryColor: [number, number, number],
  secondaryColor: [number, number, number]
) => {
  const dst = screenCtx.getImageData(x, y, width, 9);

  fillSolid(dst, primaryColor, 1, 1, width - 2, 7);
  drawHorizontalLine(dst, 1, 0, width - 2, palette.grayLight);
  drawHorizontalLine(dst, 1, 8, width - 2, secondaryColor);
  drawVerticalLine(dst, 0, 0, 9, palette.grayLight);
  drawVerticalLine(dst, width - 1, 0, 9, secondaryColor);

  screenCtx.putImageData(dst, x, y);
  renderText(fonts.mainSmall, label, x + (width >> 1) + 1, y + 2, secondaryColor, true);
};

export const renderCitizens = (x: number, y: number, width: number, city: City, happiness: Happiness): number => {
  const sp257 = getImageAsset('sp257.pic.png');

  const workers = city.size - city.specialists.length;
  const content = workers - happiness.happy - happiness.unhappy;

  const inc = Math.min(7, Math.floor((width - 12) / city.size));

  // Happy
  for (let i = 0; i < happiness.happy; i++) {
    const citizen = i % 2 === 0 ? Citizens.HappyMale : Citizens.HappyFemale;
    screenCtx.drawImage(sp257.canvas, citizen * 8, 8 * 16, 8, 15, x, y, 8, 15);
    x += inc;
  }

  if (happiness.happy > 0) {
    x += 2;
  }

  // Content
  for (let i = 0; i < content; i++) {
    const citizen = i % 2 === 0 ? Citizens.ContentMale : Citizens.ContentFemale;
    screenCtx.drawImage(sp257.canvas, citizen * 8, 8 * 16, 8, 15, x, y, 8, 15);
    x += inc;
  }

  if (content > 0) {
    x += 2;
  }

  // Unhappy
  for (let i = 0; i < happiness.unhappy; i++) {
    const citizen = i % 2 === 0 ? Citizens.UnhappyMale : Citizens.UnhappyFemale;
    screenCtx.drawImage(sp257.canvas, citizen * 8, 8 * 16, 8, 15, x, y, 8, 15);
    x += inc;
  }

  x += 4;

  // Specialists
  for (let i = 0; i < city.specialists.length; i++) {
    screenCtx.drawImage(sp257.canvas, city.specialists[i] * 8, 8 * 16, 8, 15, x, y, 8, 15);
    x += inc;
  }

  return x;
};

export const clearScreen = () => {
  screenCtx.fillRect(0, 0, 320, 200);
};

export const renderYield = (
  yieldIcon: YieldIcon,
  count: number,
  screenX: number,
  screenY: number,
  increment: number,
  negative = false
) => {
  const source = negative ? altSp257Context : getImageAsset('sp257.pic.png');

  for (let i = 0; i < count; i++) {
    screenCtx.drawImage(
      source.canvas,
      1 + 8 * 16 + (yieldIcon % 4) * 8,
      2 * 16 + (yieldIcon >> 2) * 8,
      8,
      8,
      screenX + i * increment,
      screenY,
      8,
      8
    );
  }
};

export const renderTileYield = (
  sp257: CanvasImageSource,
  tileYield: Required<TerrainYield>,
  screenX: number,
  screenY: number
) => {
  // eslint-disable-next-line prefer-const
  let { food, shields, trade } = tileYield;
  const totalYield = food + shields + trade;
  if (totalYield === 0) {
    screenCtx.drawImage(sp257, 8 * 16 + 8, 2 * 16 + 8, 8, 8, screenX + 4, screenY + 4, 8, 8);
    return;
  }

  const iconsPerLine = Math.max(2, Math.ceil(totalYield / 2));
  const spacing = Math.max(2, 8 - (iconsPerLine - 2) * 4);
  for (let i = 0; i < totalYield; i++) {
    const iconX = screenX + (i % iconsPerLine) * spacing;
    const iconY = screenY + Math.floor(i / iconsPerLine) * 8;

    let iconIndex;
    if (food > 0) {
      food--;
      iconIndex = 0;
    } else if (shields > 0) {
      shields--;
      iconIndex = 1;
    } else {
      iconIndex = 2;
    }
    screenCtx.drawImage(sp257, 8 * 16 + iconIndex * 8, 2 * 16, 8, 8, iconX, iconY, 8, 8);
  }
};

export const renderFrame = (x: number, y: number, width: number, height: number, color: [number, number, number]) => {
  const imageData = screenCtx.getImageData(x, y, width, height);
  drawFrame(imageData, 0, 0, width, height, color);
  screenCtx.putImageData(imageData, x, y);
};

export const renderHorizontalLine = (x: number, y: number, length: number, color: [number, number, number]) => {
  const imageData = screenCtx.getImageData(x, y, length, 1);
  drawHorizontalLine(imageData, 0, 0, length, color);
  screenCtx.putImageData(imageData, x, y);
};

export const renderSelectionBox = (x: number, y: number, width: number, height: number) => {
  const pattern = altSp257Context.getImageData(18 * 16, 11 * 16, 32, 16);
  const dst = screenCtx.getImageData(x, y, width, height);

  fillPattern(dst, pattern, 0, 0, width, height);
  screenCtx.putImageData(dst, x, y);
};

export const renderNewspaper = () => {
  const imageData = screenCtx.getImageData(0, 0, 320, 109);
  const pattern = getImageAsset('sp257.pic.png').getImageData(11 * 16, 8 * 16, 32, 16);

  fillSolid(imageData, palette.white, 0, 0, 320, 99);
  fillPattern(imageData, pattern, 0, 99, 320, 16);

  drawHorizontalLine(imageData, 1, 1, 318, palette.black);
  drawVerticalLine(imageData, 1, 2, 33, palette.black);
  drawVerticalLine(imageData, 318, 2, 33, palette.black);
  drawHorizontalLine(imageData, 0, 35, 320, palette.black);
  drawHorizontalLine(imageData, 0, 95, 320, palette.black);

  screenCtx.putImageData(imageData, 0, 0);
};
