import { fonts } from '../../fonts';
import { randomIntBelow } from '../../helpers';
import { City } from '../../logic/city';
import { turnToYear } from '../../logic/formulas';
import { palette } from '../../palette';
import { renderNewspaper, renderText, renderTextLines } from '../../renderer';
import { fullscreenArea, modalKeyHandler, popUiScreen, pushUiScreen, UiScreen, UiWindow } from '../ui-controller';
import { UiState } from '../ui-state';

const otherStories = [
  'Lions Defeat Gladiators 7-0!',
  'Mayor fiddles as city burns!',
  'Earth is round Columbus claims!',
  'Latest Olympic Games results!',
  'Attila sorry for misunderstanding.',
  "Cleopatra's beauty secrets! Section B.",
  'Iliad tops bestseller list, see BOOKS.',
  'Crusade ends in disaster, Press blamed.',
  'Renaissance imminent, scholars claim.',
  'We Love King? Latest poll results.',
  'Rain, Rain, more Rain! Noah predicts.',
  'Great Wall damaged, Vandals suspected.',
  'Nostradamus fortells future: Trouble ahead!',
  "Marie Antionette's diet secret: Cake!",
];

const attentionTexts = ['EXTRA!', 'FLASH'];

const newspaperName = (cityName: string) => {
  const rand = randomIntBelow(5);
  switch (rand) {
    case 0:
      return `${cityName} Weekly`;
    case 1:
      return `${cityName} Today`;
    case 2:
      return `The ${cityName} Times`;
    case 3:
      return `The ${cityName} Tribune`;
    default:
      return `${cityName} News`;
  }
};

export type NewspaperConfig = {
  city: City;
  headline: string[];
};

export const showNewspaper = (config: NewspaperConfig): Promise<void> => {
  return new Promise((res) => {
    const { city, headline } = config;
    const window: UiWindow = {
      isDirty: false,
      area: fullscreenArea,
      onRender: (state: UiState) => {
        renderNewspaper();

        const attention = attentionTexts[randomIntBelow(attentionTexts.length)];

        renderText(fonts.serif, attention, 8, 3, palette.black);
        renderText(fonts.mainSmall, otherStories[randomIntBelow(otherStories.length)], 160, 3, palette.black, true);
        renderText(fonts.serif, attention, 272, 3, palette.black);

        renderText(fonts.serifTall, ',-.', 8, 10, palette.black);
        renderText(fonts.serifTall, newspaperName(city.name), 160, 10, palette.black, true);
        renderText(fonts.serifTall, ',-.', 268, 10, palette.black);

        renderText(fonts.main, `January 1, ${turnToYear(state.gameState.turn)}`, 8, 28, palette.black);
        renderText(fonts.main, '10 cents', 272, 28, palette.black);

        renderTextLines(fonts.serifLarge, headline, 16, 40, palette.black);
      },
      onClick: () => {
        popUiScreen();
      },
    };

    const screen: UiScreen = {
      windows: [window],
      onKey: modalKeyHandler,
      onUnmount: res,
    };

    pushUiScreen(screen);
  });
};
