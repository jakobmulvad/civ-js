import { fonts } from '../../fonts';
import { incrementPerIcon, Rect } from '../../helpers';
import { palette } from '../../palette';
import { renderBlueBox, renderText, renderYield, YieldIcon } from '../../renderer';
import { UiWindow } from '../ui-controller';

const area: Rect = {
  x: 2,
  y: 106,
  width: 91,
  height: 92,
};

export const cityFoodWindow: UiWindow = {
  area,
  isDirty: true,
  onRender: (state) => {
    const { selectedCity } = state;
    if (!selectedCity) {
      return;
    }

    const foodPerRow = selectedCity.size + 1;
    const inc = incrementPerIcon(foodPerRow, 89);
    const actualWidth = inc * (foodPerRow - 1) + 8;

    renderBlueBox(area.x, area.y, area.width, area.height, [9, 89 - actualWidth, 1, 1]);
    renderText(fonts.mainSmall, 'Food Storage', 8, 108, palette.white);

    let food = selectedCity.food;
    let offsetY = area.y + 9;
    while (food > 0) {
      renderYield(YieldIcon.Food, Math.min(foodPerRow, food), 4, offsetY, inc);
      food -= selectedCity.size + 1;
      offsetY += 8;
    }
  },
};
