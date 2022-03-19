import { Rect } from '../../helpers';
import { renderBlueBox } from '../../renderer';
import { UiWindow } from '../ui-controller';

const area: Rect = {
  x: 2,
  y: 67,
  width: 123,
  height: 38,
};

export const cityUnitsWindow: UiWindow = {
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
