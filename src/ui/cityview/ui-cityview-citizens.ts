import { fonts } from '../../fonts';
import { addGameEventListener } from '../../game-event';
import { Rect } from '../../helpers';
import { Citizens, numberFormatter } from '../../logic/city';
import { cityPopulation } from '../../logic/formulas';
import { palette } from '../../palette';
import { renderBlueBox, renderCitizens, renderText, setFontColor } from '../../renderer';
import { UiWindow } from '../ui-controller';

const area: Rect = {
  x: 2,
  y: 1,
  width: 207,
  height: 21,
};

export const cityCitizensWindow: UiWindow = {
  area,
  isDirty: true,
  onRender: (state) => {
    const { selectedCity } = state;
    if (!selectedCity) {
      return;
    }
    renderBlueBox(area.x, area.y, area.width, area.height);

    const pop = cityPopulation(selectedCity.size);

    setFontColor(fonts.mainSmall, palette.white);
    renderText(fonts.mainSmall, `${selectedCity.name} (POP:${numberFormatter.format(pop)})`, 104, 2, true);

    const workers = selectedCity.workedTiles.length;
    const x = renderCitizens(7, 8, [Citizens.ContentMale, Citizens.ContentFemale], workers);

    renderCitizens(x + 4, 8, selectedCity.specialists);
  },
};

addGameEventListener('GameStateUpdated', () => (cityCitizensWindow.isDirty = true));
