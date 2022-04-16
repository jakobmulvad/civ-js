import { City } from '../../logic/city';
import { clearScreenWindow } from '../components/ui-clear-screen';
import { modalKeyHandler, pushUiScreen, UiScreen } from '../ui-controller';
import { updateUiState } from '../ui-state';
import { cityBottomButtonsWindow } from './ui-cityview-bottom-buttons';
import { cityBuildingsWindow } from './ui-cityview-buildings';
import { cityCitizensWindow } from './ui-cityview-citizens';
import { cityFoodWindow } from './ui-cityview-food';
import { cityInfoWindow } from './ui-cityview-info';
import { cityMapWindow } from './ui-cityview-map';
import { cityProductionWindow } from './ui-cityview-production';
import { cityResourcesWindow } from './ui-cityview-resources';
import { citySupplyWindow } from './ui-cityview-supply';

export const showCityScreen = (city: City): Promise<void> => {
  return new Promise((res) => {
    const screen: UiScreen = {
      onKey: modalKeyHandler,
      onUnmount: res,
      windows: [
        clearScreenWindow,
        cityCitizensWindow,
        cityResourcesWindow,
        citySupplyWindow,
        cityFoodWindow,
        cityMapWindow,
        cityInfoWindow,
        cityBuildingsWindow,
        cityProductionWindow,
        cityBottomButtonsWindow,
      ],
    };

    updateUiState('selectedCity', city);
    pushUiScreen(screen);
  });
};
