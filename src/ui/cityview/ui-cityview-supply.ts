import { Rect } from '../../helpers';
import { cityUnits } from '../../logic/city';
import { cityUnitSupply } from '../../logic/game-state';
import { renderBlueBox, renderYield, YieldIcon } from '../../renderer';
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
      const x = area.x + 5 + i * 17;
      const y = area.y + 2;
      const supply = cityUnitSupply(ownerPlayer.government, gameState, units[i]);
      renderYield(YieldIcon.Food, supply.food, x, y + 16, 4);
      renderYield(YieldIcon.Void, supply.unhappy, x, y + 16, 4);
      renderYield(YieldIcon.Shield, supply.shields, x + 4, y + 16, 4);
      //renderUnitPrototype(units[i].prototypeId, selectedCity.owner, area.x + 5 + i * 17, area.y + 2);
    }
  },
};
