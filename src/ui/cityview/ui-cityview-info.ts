import { Rect } from '../../helpers';
import { renderBlueBox } from '../../renderer';
import { UiWindow } from '../ui-controller';

const area: Rect = {
  x: 95,
  y: 106,
  width: 133,
  height: 92,
};

export const cityInfoWindow: UiWindow = {
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
