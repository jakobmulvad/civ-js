import { getImageAsset } from '../../assets';
import { fonts } from '../../fonts';
import { addGameEventListener } from '../../game-event';
import { Rect } from '../../helpers';
import { buildings } from '../../logic/buildings';
import {
  City,
  cityHappinessBase,
  cityHappinessImprovements,
  cityHappinessLuxury,
  cityHappinessSupply,
  totalCityYield,
} from '../../logic/city';
import { GameState, getUnitsAt, homeCityName, totalCitySupply, unitIndex } from '../../logic/game-state';
import { palette } from '../../palette';
import {
  renderBlueBox,
  renderCitizens,
  renderHorizontalLine,
  renderSmallButton,
  renderSprite,
  renderText,
  renderUnit,
  renderYield,
  YieldIcon,
} from '../../renderer';
import { pushUiAction } from '../ui-action-queue';
import { UiWindow } from '../ui-controller';
import { getUiState } from '../ui-state';

const area: Rect = {
  x: 95,
  y: 106,
  width: 133,
  height: 92,
};

enum TabId {
  Info = 'Info',
  Happy = 'Happy',
  Map = 'Map',
  View = 'View',
}

type UiTab = {
  onRender: (state: GameState, city: City) => void;
  onClick?: (state: GameState, city: City, x: number, y: number) => void;
};

const tabs: Record<TabId, UiTab> = {
  [TabId.Info]: {
    onRender: (state, city) => {
      const units = getUnitsAt(state, city.x, city.y);

      const sp257 = getImageAsset('sp257.pic.png').canvas;
      for (let i = 0; i < units.length; i++) {
        const x = area.x + 5 + 17 * (i % 7);
        const y = area.y + 10 + Math.floor(i / 7) * 22;
        renderUnit(sp257, units[i], x, y);
        const homeName = homeCityName(state, units[i]);
        renderText(fonts.mainSmall, homeName.slice(0, 3) + '.', x, y + 15, palette.black);
      }
    },
    onClick: (state, city, x, y) => {
      const column = Math.floor((x - 5) / 17);
      const row = Math.floor((y - 10) / 22);
      if (column > -1 && column < 7 && row > -1) {
        const index = column + row * 7;
        const units = getUnitsAt(state, city.x, city.y);
        if (index < units.length) {
          pushUiAction({
            type: 'UnitWake',
            player: city.owner,
            unit: unitIndex(state, units[index]),
          });
        }
      }
    },
  },
  [TabId.Happy]: {
    onRender: (state, city) => {
      const { map } = state.players[city.owner];

      // Base
      let offsetY = area.y + 10;
      const happiness = cityHappinessBase(state, city);
      renderCitizens(area.x + 5, offsetY, 100, city, happiness);

      offsetY += 16;
      renderHorizontalLine(area.x + 5, offsetY - 2, 122, palette.blueDark);

      // Luxury
      const totalYield = totalCityYield(state, map, city);
      if (totalYield.luxury > 0) {
        cityHappinessLuxury(city, totalYield, happiness);
        renderCitizens(area.x + 5, offsetY, 100, city, happiness);
        renderYield(YieldIcon.Luxury, 1, area.x + area.width - 15, offsetY + 3, 1);
        offsetY += 16;
        renderHorizontalLine(area.x + 5, offsetY - 2, 122, palette.blueDark);
      }

      const happinessBuildings = city.buildings.map((id) => buildings[id]).filter((b) => b.applyHappiness);
      if (happinessBuildings.length > 0) {
        cityHappinessImprovements(state, city, happiness);
        renderCitizens(area.x + 5, offsetY, 100, city, happiness);
        const offsetX = area.x + area.width - happinessBuildings.length * 16 - 4;
        for (let i = 0; i < happinessBuildings.length; i++) {
          renderSprite(happinessBuildings[i].sprite, offsetX + i * 16, offsetY);
        }
        offsetY += 16;
        renderHorizontalLine(area.x + 5, offsetY - 2, 122, palette.blueDark);
      }

      const supply = totalCitySupply(state, city);
      if (supply.unhappy > 0) {
        cityHappinessSupply(state, city, supply, happiness);
        renderCitizens(area.x + 5, offsetY, 100, city, happiness);
        renderYield(YieldIcon.Void, 1, area.x + area.width - 15, offsetY + 3, 1);
        offsetY += 16;
        renderHorizontalLine(area.x + 5, offsetY - 2, 122, palette.blueDark);
      }
    },
  },
  [TabId.Map]: {
    onRender: () => {
      renderText(fonts.mainSmall, 'Not Implemented', area.x + 5, area.y + 12, palette.black);
    },
  },
  [TabId.View]: {
    onRender: () => {
      renderText(fonts.mainSmall, 'Not Implemented', area.x + 5, area.y + 12, palette.black);
    },
  },
};

let activeTab = TabId.Info;

export const cityInfoWindow: UiWindow = {
  area,
  isDirty: true,
  onRender: (state) => {
    const { selectedCity, gameState } = state;
    if (!selectedCity) {
      return;
    }
    renderBlueBox(area.x, area.y, area.width, area.height);

    let yOffset = 0;
    for (const tab of Object.values(TabId)) {
      const active = activeTab === tab;
      renderSmallButton(tab, area.x + yOffset, area.y, 33, active ? palette.white : palette.blue, palette.blueDark);
      yOffset += 33;
    }

    tabs[activeTab].onRender(gameState, selectedCity);
  },
  onMount: () => {
    activeTab = TabId.Info;
  },
  onClick: (x, y) => {
    const { selectedCity, gameState } = getUiState();
    if (!selectedCity) {
      return;
    }

    if (y < 10) {
      const tabIndex = Math.floor(x / 33);
      console.log(tabIndex);
      activeTab = Object.values(TabId)[tabIndex];
      cityInfoWindow.isDirty = true;
    }

    tabs[activeTab].onClick?.(gameState, selectedCity, x, y);
  },
};

addGameEventListener('GameStateUpdated', () => (cityInfoWindow.isDirty = true));
