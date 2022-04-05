import { fonts } from '../../fonts';
import { Rect } from '../../helpers';
import { buildings } from '../../logic/buildings';
import { sellPrice } from '../../logic/city';
import { palette } from '../../palette';
import { renderBlueBox, renderSprite, renderText, renderYield, setFontColor, YieldIcon } from '../../renderer';
import { newSelect } from '../components/ui-select';
import { pushUiAction } from '../ui-action-queue';
import { pushUiScreen, UiWindow } from '../ui-controller';
import { getUiState } from '../ui-state';

const area: Rect = {
  x: 211,
  y: 1,
  width: 108,
  height: 97,
};

export const cityBuildingsWindow: UiWindow = {
  area,
  isDirty: true,
  onRender: (state) => {
    const { selectedCity } = state;
    if (!selectedCity) {
      return;
    }
    renderBlueBox(area.x, area.y, area.width, area.height);

    if (!selectedCity.buildings.length) {
      return;
    }

    setFontColor(fonts.mainSmall, palette.white);

    for (let i = 0; i < selectedCity.buildings.length; i++) {
      const building = buildings[selectedCity.buildings[i]];
      if (i === 0) {
        // First building icon is special case because we need to cut off 2 pixels
        renderSprite(
          { ...building.sprite, y: building.sprite.y + 2, height: building.sprite.height - 2 },
          area.x + 2 + 20,
          2
        );
      } else {
        renderSprite(building.sprite, area.x + 2 + 20 * ((i + 1) % 2), i * fonts.mainSmall.height);
      }
      renderText(fonts.mainSmall, building.name, area.x + 42, 4 + i * fonts.mainSmall.height);
      if (!selectedCity.hasSold) {
        renderYield(YieldIcon.Coin, 1, area.x + area.width - 9, 2 + i * fonts.mainSmall.height, 0, true);
      }
    }
  },
  onClick: (x, y) => {
    const { selectedCity, localPlayer, gameState } = getUiState();
    if (!selectedCity || selectedCity.hasSold || x < area.width - 9 || x > area.width - 1) {
      return;
    }

    const buildingIndex = Math.floor((y - 2) / fonts.mainSmall.height);
    if (buildingIndex < 0 || buildingIndex > selectedCity.buildings.length - 1) {
      return;
    }

    const buildingId = selectedCity.buildings[buildingIndex];
    const building = buildings[buildingId];

    const city = gameState.players[localPlayer].cities.indexOf(selectedCity);
    const select = newSelect({
      x: 80,
      y: 80,
      title: ['Do you want to sell', `your ${building.name} for ${sellPrice(building)}$?`],
      options: ['No.', 'Yes.'],
      onSelect: (value) => {
        if (value === 'Yes.') {
          pushUiAction({
            type: 'CitySell',
            player: localPlayer,
            city,
            building: buildingId,
          });
        }
      },
    });
    pushUiScreen(select);
  },
};
