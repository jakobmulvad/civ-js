import { fonts } from '../../fonts';
import { addGameEventListener } from '../../game-event';
import { incrementPerIcon, Rect } from '../../helpers';
import { totalCityYield } from '../../logic/city';
import { totalCitySupply } from '../../logic/game-state';
import { palette } from '../../palette';
import { renderBlueBox, renderText, renderYield, YieldIcon } from '../../renderer';
import { UiWindow } from '../ui-controller';

const area: Rect = {
  x: 2,
  y: 23,
  width: 123,
  height: 43,
};

const gab = 4;

const renderYieldAndConsumption = (icon: YieldIcon, production: number, consumption: number, y: number) => {
  const inc = incrementPerIcon(Math.max(production, consumption), 119 - gab); // add space for a gab before surplus
  const surplus = production - consumption;
  const consumed = Math.min(consumption, production);

  let offset = 4;
  if (consumed > 0) {
    renderYield(icon, consumed, offset, y, inc);
    offset += consumed * inc + gab;
  }

  if (surplus > 0) {
    renderYield(icon, surplus, offset, y, inc);
  } else {
    renderYield(icon, -surplus, offset, y, inc, true);
  }
};

export const cityResourcesWindow: UiWindow = {
  area,
  isDirty: true,
  onRender: (state) => {
    const { selectedCity, gameState } = state;
    if (!selectedCity) {
      return;
    }

    renderBlueBox(area.x, area.y, area.width, area.height, [9, 1, 1, 1]);
    renderText(fonts.mainSmall, 'City Resources', 8, 25, palette.white);

    const owner = gameState.players[selectedCity.owner];
    const totalYield = totalCityYield(gameState, owner.map, selectedCity);
    const totalSupply = totalCitySupply(gameState, selectedCity);

    const foodConsumption = selectedCity.size * 2 + totalSupply.food;
    renderYieldAndConsumption(YieldIcon.Food, totalYield.food, foodConsumption, 32);

    renderYieldAndConsumption(YieldIcon.Shield, totalYield.shields, totalSupply.shields, 40);

    renderYieldAndConsumption(YieldIcon.Trade, totalYield.trade, totalYield.trade + totalYield.corruption, 48);

    //renderYield(YieldIcon.Trade, totalYield.trade, 4, 48, incrementPerIcon(totalYield.trade, 119));
    const tradeInc = incrementPerIcon(totalYield.luxury + totalYield.gold + totalYield.beakers, 119 - gab * 2);
    let tradeOffset = 4;

    if (totalYield.luxury > 0) {
      renderYield(YieldIcon.Luxury, totalYield.luxury, tradeOffset, 56, tradeInc);
      tradeOffset += tradeInc * totalYield.luxury + gab;
    }

    if (totalYield.gold > 0) {
      renderYield(YieldIcon.Coin, totalYield.gold, tradeOffset, 56, tradeInc);
      tradeOffset += tradeInc * totalYield.gold + gab;
    }

    renderYield(YieldIcon.Beaker, totalYield.beakers, tradeOffset, 56, tradeInc);
  },
};

addGameEventListener('GameStateUpdated', () => (cityResourcesWindow.isDirty = true));
