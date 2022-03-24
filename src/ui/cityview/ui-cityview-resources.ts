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
    if (totalYield.food > foodConsumption) {
      const inc = incrementPerIcon(totalYield.food, 119 + gab); // add space for a gab before surplus
      const surplus = totalYield.food - foodConsumption;
      renderYield(sp257.canvas, YieldIcon.Food, foodConsumption, 4, 32, inc);
      renderYield(sp257.canvas, YieldIcon.Food, surplus, 4 + inc * foodConsumption + gab, 32, inc);
    } else {
      renderYield(sp257.canvas, YieldIcon.Food, totalYield.food, 4, 32, incrementPerIcon(totalYield.food, 119));
    }

    renderYield(sp257.canvas, YieldIcon.Shield, totalYield.shields, 4, 40, incrementPerIcon(totalYield.shields, 119));
    renderYield(sp257.canvas, YieldIcon.Trade, totalYield.trade, 4, 48, incrementPerIcon(totalYield.trade, 119));

    const tradeInc = incrementPerIcon(totalYield.luxury + totalYield.gold + totalYield.beakers, 119 + gab * 2);
    const coinOffset = tradeInc * totalYield.luxury + gab;
    const beakerOffset = coinOffset + tradeInc * totalYield.gold + gab;
    renderYield(sp257.canvas, YieldIcon.Luxury, totalYield.luxury, 4, 56, tradeInc);
    renderYield(sp257.canvas, YieldIcon.Coin, totalYield.gold, 4 + coinOffset, 56, tradeInc);
    renderYield(sp257.canvas, YieldIcon.Beaker, totalYield.beakers, 4 + beakerOffset, 56, tradeInc);
  },
};

addGameEventListener('GameStateUpdated', () => (cityResourcesWindow.isDirty = true));
