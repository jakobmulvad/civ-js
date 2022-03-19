import { cityViewKeyboardMap, worldViewKeyboardMap } from '../input-mapping';
import { UiScreen } from './ui-controller';
import { pushUiEvent } from './ui-event-queue';
import { unitInfoWindow } from './ui-worldview-unit-info';
import { empireInfoWindow } from './ui-worldview-empire-info';
import { minimapWindow } from './ui-worldview-minimap';
import { mapWindow } from './ui-worldview-map';
import { cityBottomButtonsWindow } from './cityview/ui-cityview-bottom-buttons';
import { clearScreen } from '../renderer';
import { cityCitizensWindow } from './cityview/ui-cityview-citizens';
import { cityResourcesWindow } from './cityview/ui-cityview-resources';
import { cityFoodWindow } from './cityview/ui-cityview-food';
import { cityUnitsWindow } from './cityview/ui-cityview-units';
import { cityInfoWindow } from './cityview/ui-cityview-info';
import { cityMapWindow } from './cityview/ui-cityview-map';
import { cityBuildingsWindow } from './cityview/ui-cityview-buildings';
import { cityProductionWindow } from './cityview/ui-cityview-production';

export const uiWorldView: UiScreen = {
  onKey: (keyCode: string) => {
    const event = worldViewKeyboardMap[keyCode];
    if (event) {
      pushUiEvent(event);
    }
  },
  windows: [unitInfoWindow, empireInfoWindow, minimapWindow, mapWindow],
};

export const uiCityView: UiScreen = {
  onKey: (keyCode: string) => {
    const event = cityViewKeyboardMap[keyCode];
    if (event) {
      pushUiEvent(event);
    }
  },
  onMount: () => {
    clearScreen();
  },
  windows: [
    cityCitizensWindow,
    cityResourcesWindow,
    cityUnitsWindow,
    cityFoodWindow,
    cityMapWindow,
    cityInfoWindow,
    cityBuildingsWindow,
    cityProductionWindow,
    cityBottomButtonsWindow,
  ],
};
