import { Rect } from '../../helpers';
import { cityUnits } from '../../logic/city';
import { unitSupply } from '../../logic/game-state';
import { renderBlueBox, renderUnitPrototype, renderYield, YieldIcon } from '../../renderer';
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
    const ownerPlayer = gameState.players[selectedCity.owner];
    const units = cityUnits(gameState, selectedCity);

    renderBlueBox(area.x, area.y, area.width, area.height);

    for (let i = 0; i < units.length; i++) {
      const row = Math.floor(i / 7);
      const column = i % 7;
      const x = area.x + 5 + column * 16;
      const y = area.y + 2 + row * 16;
      const supply = unitSupply(gameState, ownerPlayer.government, units[i]);

      renderYield(YieldIcon.Food, supply.food, x, y + 11, 2);
      renderYield(YieldIcon.Void, supply.unhappy, x, y + 11, 2);
      renderYield(YieldIcon.Shield, supply.shields, x + 8, y + 11, 2);
      renderUnitPrototype(units[i].prototypeId, selectedCity.owner, x, y);
    }
  },
};
