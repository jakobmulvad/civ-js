import { Rect } from '../../helpers';
import { renderBlueBox } from '../../renderer';
import { UiWindow } from '../ui-controller';

const area: Rect = {
  x: 230,
  y: 99,
  width: 88,
  height: 90,
};

export const cityProductionWindow: UiWindow = {
  area,
  isDirty: true,
  onRender: (state) => {
    const { selectedCity } = state;
    if (!selectedCity) {
      return;
    }
    renderBlueBox(area.x, area.y, area.width, area.height);
  },
};
