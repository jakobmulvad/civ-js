import { fonts } from '../../fonts';
import { Rect } from '../../helpers';
import { buildings } from '../../logic/buildings';
import { palette } from '../../palette';
import { renderBlueBox, renderSprite, renderText, setFontColor } from '../../renderer';
import { UiWindow } from '../ui-controller';

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
    setFontColor(fonts.mainSmall, palette.white);
    for (let i = 0; i < selectedCity.buildings.length; i++) {
      const building = buildings[selectedCity.buildings[i]];
      renderSprite(building.sprite, area.x + 2 + 20 * ((i + 1) % 2), i * fonts.mainSmall.height);
      renderText(fonts.mainSmall, building.name, area.x + 42, 4 + i * fonts.mainSmall.height);
    }
  },
};
