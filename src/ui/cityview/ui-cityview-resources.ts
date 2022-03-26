import { getImageAsset } from '../../assets';
import { fonts } from '../../fonts';
import { addGameEventListener } from '../../game-event';
import { incrementPerIcon, Rect } from '../../helpers';
import { totalCityYield } from '../../logic/city';
import { palette } from '../../palette';
import { renderBlueBox, renderText, renderYield, setFontColor, YieldIcon } from '../../renderer';
import { UiWindow } from '../ui-controller';

const area: Rect = {
  x: 2,
  y: 23,
  width: 123,
  height: 43,
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
    setFontColor(fonts.mainSmall, palette.white);
    renderText(fonts.mainSmall, 'City Resources', 8, 25);

    const sp257 = getImageAsset('sp257.pic.png');
    const totalYield = totalCityYield(gameState, gameState.players[selectedCity.owner].map, selectedCity);

    console.log(totalYield);

    const gab = 4;
    const foodConsumption = selectedCity.size * 2;
    const inc = incrementPerIcon(Math.max(totalYield.food, foodConsumption), 119 - gab); // add space for a gab before surplus
    const surplus = totalYield.food - foodConsumption;

    renderYield(sp257, YieldIcon.Food, Math.min(foodConsumption, totalYield.food), 4, 32, inc);

    if (surplus > 0) {
      renderYield(sp257, YieldIcon.Food, surplus, 4 + inc * foodConsumption + gab, 32, inc);
    } else {
      renderYield(sp257, YieldIcon.Food, -surplus, 4 + inc * totalYield.food + gab, 32, inc, true);
    }

    renderYield(sp257, YieldIcon.Shield, totalYield.shields, 4, 40, incrementPerIcon(totalYield.shields, 119));
    renderYield(sp257, YieldIcon.Trade, totalYield.trade, 4, 48, incrementPerIcon(totalYield.trade, 119));

    const tradeInc = incrementPerIcon(totalYield.luxury + totalYield.gold + totalYield.beakers, 119 + gab * 2);
    let tradeOffset = 4;

    if (totalYield.luxury > 0) {
      renderYield(sp257, YieldIcon.Luxury, totalYield.luxury, tradeOffset, 56, tradeInc);
      tradeOffset += tradeInc * totalYield.luxury + gab;
    }

    if (totalYield.gold > 0) {
      renderYield(sp257, YieldIcon.Coin, totalYield.gold, tradeOffset, 56, tradeInc);
      tradeOffset += tradeInc * totalYield.gold + gab;
    }

    renderYield(sp257, YieldIcon.Beaker, totalYield.beakers, tradeOffset, 56, tradeInc);
  },
};

addGameEventListener('GameStateUpdated', () => (cityResourcesWindow.isDirty = true));
