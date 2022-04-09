import { Rect } from '../../helpers';
import { citySupplyUnits } from '../../logic/city';
import { renderBlueBox, renderUnitPrototype } from '../../renderer';
import { UiWindow } from '../ui-controller';

const area: Rect = {
  x: 2,
  y: 67,
  width: 123,
  height: 38,
};

export const citySupplyWindow: UiWindow = {
  area,
  isDirty: true,
  onRender: (state) => {
    const { selectedCity, gameState } = state;
    if (!selectedCity) {
      return;
    }
    renderBlueBox(area.x, area.y, area.width, area.height);
    const units = citySupplyUnits(gameState, selectedCity);

    for (let i = 0; i < units.length; i++) {
      renderUnitPrototype(units[i].prototypeId, selectedCity.owner, area.x + 5 + i * 17, area.y + 2);
    }
  },
};
