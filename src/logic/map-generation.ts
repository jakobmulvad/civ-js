// Algorithm described here: https://forums.civfanatics.com/threads/civ1-map-generation-explained.498630/
// Special thanks to darkpanda <3

import { clamp, direction4, direction8, randomIntBelow, randomIntBetween } from '../helpers';
import { MapTemplate, TerrainId } from './map';

const direction = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

export enum Landmass {
  Small = 0,
  Normal = 1,
  Large = 2,
}

export enum Temperature {
  Cool = 0,
  Temperate = 1,
  Warm = 2,
}

export enum Climate {
  Arid = 0,
  Normal = 1,
  Wet = 2,
}

export enum Age {
  ThreeBillion = 0,
  FourBillion = 1,
  FiveBillion = 2,
}

export type MapGenerationSettings = {
  width: number;
  height: number;
  landmass: Landmass;
  temperature: Temperature;
  climate: Climate;
  age: Age;
};

const defaultSettings: MapGenerationSettings = {
  width: 80,
  height: 50,
  landmass: Landmass.Normal,
  temperature: Temperature.Temperate,
  climate: Climate.Normal,
  age: Age.FourBillion,
};

const generateChunk = (stencil: boolean[], width: number, height: number) => {
  // Clear stencil
  stencil.fill(false);

  let x = randomIntBetween(4, width - 4);
  let y = randomIntBetween(8, height - 8);
  const path = randomIntBetween(1, 64);

  for (let i = 0; i < path; i++) {
    const i = x + y * width;
    stencil[i] = true;
    stencil[i + 1] = true;
    stencil[i + width] = true;
    const [dx, dy] = direction[randomIntBelow(4)];
    x += dx;
    y += dy;

    if (x < 3 || x > width - 3 || y < 3 || y > height - 3) {
      // we are out of bounds
      break;
    }
  }
};

const landmassPercentage = (elevation: number[]) => {
  return elevation.reduce((sum, elevation) => sum + (elevation > 0 ? 1 : 0), 0) / elevation.length;
};

const fixNarrowPassage = (elevation: number[], width: number, height: number) => {
  for (let x = 0; x < width - 1; x++) {
    for (let y = 0; y < height - 1; y++) {
      const i1 = x + y * width;
      const i2 = i1 + 1;
      const i3 = i1 + width;
      const i4 = i3 + 1;
      if (elevation[i1] && !elevation[i2] && !elevation[i3] && elevation[i4]) {
        elevation[i2] = 1;
        elevation[i3] = 1;
      } else if (!elevation[i1] && elevation[i2] && elevation[i3] && !elevation[i4]) {
        elevation[i4] = 1;
      }
    }
  }
};

const initialTerrain = (temperature: number): TerrainId => {
  switch (temperature) {
    case 0:
    case 1:
      return TerrainId.Desert;
    case 2:
    case 3:
      return TerrainId.Plains;
    case 4:
    case 5:
      return TerrainId.Tundra;
    default:
      return TerrainId.Arctic;
  }
};

const temperatureAdjustment = (map: MapTemplate, elevation: number[], temperatureParam: Temperature) => {
  for (let x = 0; x < map.width; x++) {
    for (let y = 0; y < map.height; y++) {
      const i = x + y * map.width;
      // Rewritten a bit to support arbitrary map size
      let temp = (y / map.height) * 50 - 29;
      temp += randomIntBelow(8);
      temp = Math.abs(temp);
      temp += 1 - temperatureParam;
      temp = Math.round(temp / 6 + 1);

      /*let temp = y - 29;
      temp += randomIntBetween(0, 8);
      temp = Math.abs(temp);
      temp += 1 - temperatureParam;
      temp = Math.round(temp / 6 + 1);*/

      switch (elevation[i]) {
        case 0:
          map.data[i] = TerrainId.Ocean;
          break;

        case 1:
          map.data[i] = initialTerrain(temp);
          break;

        case 2:
          map.data[i] = TerrainId.Hills;
          break;

        default:
          // Anything above 2 is mountain
          map.data[i] = TerrainId.Mountains;
          break;
      }
    }
  }
};

const climateAdjustment = (map: MapTemplate, climate: Climate) => {
  for (let y = 0; y < map.height; y++) {
    let humidity = 0;
    const latitude = Math.abs(25 - (y * 50) / map.height);

    // Phase 1 - west to east
    for (let x = 0; x < map.width; x++) {
      const i = x + y * map.width;

      if (map.data[i] === TerrainId.Ocean) {
        // Gather humidity
        const evaporation = Math.abs(latitude - 12) + climate * 4;
        if (evaporation > humidity) {
          humidity++;
        }
      } else if (humidity > 0) {
        // This check for humidity is not described by darkpanda but it must be present or the algorithm doesn't make sense
        const precipitation = randomIntBelow(7 - climate * 2);
        humidity -= precipitation;

        // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
        switch (map.data[i]) {
          case TerrainId.Plains:
            map.data[i] = TerrainId.Grassland;
            break;
          case TerrainId.Tundra:
            map.data[i] = TerrainId.Arctic;
            break;
          case TerrainId.Hills:
            map.data[i] = TerrainId.Forest;
            break;
          case TerrainId.Desert:
            map.data[i] = TerrainId.Plains;
            break;
          case TerrainId.Mountains:
            humidity -= 3;
            break;
        }
      }
    }

    humidity = 0;

    // Phase 2 - east to west
    // eslint-disable-next-line for-direction
    for (let x = map.width - 1; x >= 0; x--) {
      const i = x + y * map.width;
      if (map.data[i] === TerrainId.Ocean) {
        // Gather humidity
        const evaporation = (latitude >> 1) + climate;
        if (evaporation > humidity) {
          humidity++;
        }
      } else if (humidity > 0) {
        const precipitation = randomIntBelow(7 - climate * 2);
        humidity -= precipitation;

        // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
        switch (map.data[i]) {
          case TerrainId.Plains:
            map.data[i] = TerrainId.Grassland;
            break;
          case TerrainId.Grassland:
            map.data[i] = latitude < 10 ? TerrainId.Jungle : TerrainId.Swamp;
            break;
          case TerrainId.Hills:
            map.data[i] = TerrainId.Forest;
            break;
          case TerrainId.Desert:
            map.data[i] = TerrainId.Plains;
            break;
          case TerrainId.Mountains:
            map.data[i] = TerrainId.Forest;
            humidity -= 3;
            break;
        }
      }
    }
  }
};

const ageAdjustment = (map: MapTemplate, age: Age) => {
  const loopCount = 800 * ((map.width * map.height) / (80 * 50)) * (1 + age);

  let x = 0;
  let y = 0;
  for (let loop = 0; loop < loopCount; loop++) {
    if (loop % 2 === 0) {
      x = randomIntBelow(map.width);
      y = randomIntBelow(map.height);
    } else {
      const [dx, dy] = direction8[randomIntBelow(direction8.length)];
      x = clamp(0, x + dx, map.width - 1);
      y = clamp(0, y + dy, map.height - 1);
    }
    const i = x + y * map.width;
    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
    switch (map.data[i]) {
      case TerrainId.Forest:
        map.data[i] = TerrainId.Jungle;
        break;
      case TerrainId.Swamp:
        map.data[i] = TerrainId.Grassland;
        break;
      case TerrainId.Plains:
        map.data[i] = TerrainId.Hills;
        break;
      case TerrainId.Tundra:
        map.data[i] = TerrainId.Hills;
        break;
      case TerrainId.Grassland:
        map.data[i] = TerrainId.Forest;
        break;
      case TerrainId.Jungle:
        map.data[i] = TerrainId.Swamp;
        break;
      case TerrainId.Hills:
        map.data[i] = TerrainId.Mountains;
        break;
      case TerrainId.Mountains: {
        const surroundingTerrain = direction4.map(([dx, dy]) => {
          const tx = clamp(0, x + dx, map.width - 1);
          const ty = clamp(0, y + dy, map.height - 1);
          return map.data[tx + ty * map.width];
        });
        if (surroundingTerrain.every((t) => t !== TerrainId.Ocean)) {
          map.data[i] = TerrainId.Ocean;
        }
        break;
      }
      case TerrainId.Desert:
        map.data[i] = TerrainId.Plains;
        break;
      case TerrainId.Arctic:
        map.data[i] = TerrainId.Mountains;
        break;
    }
  }
};

const generateRivers = (map: MapTemplate, climate: Climate, landmass: Landmass) => {
  const maxRivers = (climate + landmass) * 2 + 6;
  let riverCount = 0;
  let loop = 0;

  while (loop < 256 && riverCount < maxRivers) {
    console.log('outer loop', loop);
    loop++;
    let riverLength = 0;
    let riverDirection = randomIntBelow(4) * 2;
    const mapClone = map.data.slice();

    let tileX = -1;
    let tileY = -1;
    while (tileX === -1) {
      const x = randomIntBelow(map.width);
      const y = randomIntBelow(map.height);
      if (map.data[x + y * map.width] === TerrainId.Hills) {
        tileX = x;
        tileY = y;
      }
    }

    let oceanNearby: boolean;
    const terminationTerrain = [TerrainId.Ocean, TerrainId.River, TerrainId.Mountains];

    console.log('enter inner loop');
    do {
      map.data[tileX + tileY * map.width] = TerrainId.River;
      oceanNearby = direction4.some(([dx, dy]) => map.data[tileX + dx + (tileY + dy) * map.width] === TerrainId.Ocean);
      const downflowHeuristics = randomIntBelow(2);
      riverDirection = ((downflowHeuristics - (riverLength % 2)) * 2 + riverDirection) & 0x07;
      const [dx, dy] = direction4[riverDirection >> 1];
      tileX += dx;
      tileY += dy;
      riverLength++;
      console.log(riverLength);
    } while (!oceanNearby && !terminationTerrain.some((t) => t === map.data[tileX + tileY * map.width]));

    if ((oceanNearby || map.data[tileX + tileY * map.width] === TerrainId.River) && riverLength > 5) {
      // Success!
      riverCount++;
      for (let dx = -3; dx < 4; dx++) {
        for (let dy = -3; dy < 4; dy++) {
          const i = tileX + dx + (tileY + dy) * map.width;
          if (i < 0 || i >= map.width) {
            continue;
          }
          if (map.data[i] === TerrainId.Forest) {
            map.data[i] = TerrainId.Jungle;
          }
        }
      }
    } else {
      // Failure :(
      map.data = mapClone;
    }
  }
};

export const generateMapTemplate = (settings?: Partial<MapGenerationSettings>): MapTemplate => {
  const finalSettings = {
    ...defaultSettings,
    ...settings,
  };

  const { width, height } = finalSettings;
  const stencil = new Array<boolean>(width * height);
  const elevation = new Array<number>(width * height).fill(0);
  const map: MapTemplate = {
    width,
    height,
    data: new Array<TerrainId>(width * height).fill(TerrainId.Ocean),
  };

  const targetLandmass = 0.16 + finalSettings.landmass * 0.08;

  // Phase 1 - Generate landmass
  do {
    generateChunk(stencil, width, height);
    for (let i = 0; i < stencil.length; i++) {
      elevation[i] += stencil[i] ? 1 : 0;
    }
    console.log(landmassPercentage(elevation), targetLandmass);
  } while (landmassPercentage(elevation) < targetLandmass);
  fixNarrowPassage(elevation, width, height);

  // Phase 2 - Assign initial terrain based on temperature
  temperatureAdjustment(map, elevation, finalSettings.temperature);

  // Phase 3 - Add humidity to map
  climateAdjustment(map, finalSettings.climate);

  // Phase 4 - Erode terrain over time
  ageAdjustment(map, finalSettings.age);

  // Phase 5 - Generate rivers
  generateRivers(map, finalSettings.climate, finalSettings.landmass);

  return map;
};
