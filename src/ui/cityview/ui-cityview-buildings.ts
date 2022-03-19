import { Rect } from '../../helpers';
import { renderBlueBox } from '../../renderer';
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
  },
};
