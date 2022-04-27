import { fonts } from '../../fonts';
import { Advisors } from '../../logic/advisors';
import { GameState } from '../../logic/game-state';
import { palette } from '../../palette';
import { renderText } from '../../renderer';
import { lzwDecode, lzwEncode } from '../../util/lzw-compression';
import { showAdvisorModal } from '../components/ui-advisor-modal';
import { uiRender, UiWindow } from '../ui-controller';
import { getUiState, updateUiState } from '../ui-state';
import { showSelect, UiSelectOption, UiSelectValuePair } from '../components/ui-select';
import { pushUiAction } from '../ui-action-queue';
import { showNewspaper } from '../components/ui-newspaper';

enum MenuKey {
  Void,
  TaxRate,
  LuxuriesRate,
  FindCity,
  Options,
  LoadGame,
  SaveGame,
  Revolution,
  Retire,
  Quit,
}

type Menu = {
  offsetX: number;
  label: string;
  options: UiSelectValuePair<MenuKey>[];
};

const menus: Menu[] = [
  {
    offsetX: 8,
    label: 'GAME',
    options: [
      { label: 'Tax Rate', value: MenuKey.TaxRate },
      { label: 'Luxuries Rate', value: MenuKey.LuxuriesRate },
      { label: 'FindCity', value: MenuKey.FindCity },
      { label: 'Options', value: MenuKey.Options },
      { label: 'Load Game', value: MenuKey.LoadGame },
      { label: 'Save Game', value: MenuKey.SaveGame },
      { label: 'REVOLUTION!', value: MenuKey.Revolution },
      { label: '', value: MenuKey.Void },
      { label: 'Retire', value: MenuKey.Retire },
      { label: 'QUIT to DOS', value: MenuKey.Quit },
    ],
  },
  {
    offsetX: 64,
    label: 'ORDERS',
    options: [],
  },
  {
    offsetX: 128,
    label: 'ADVISORS',
    options: [],
  },
  {
    offsetX: 192,
    label: 'WORLD',
    options: [],
  },
  {
    offsetX: 240,
    label: 'CIVILOPEDIA',
    options: [],
  },
];

const taxRate = () => {
  const { gameState, localPlayer } = getUiState();
  const player = gameState.players[localPlayer];
  const options: UiSelectOption<number>[] = [];

  for (let i = 0; i <= 10 - player.luxuryRate; i++) {
    options.push({ label: `${i * 10}% Tax, (${(10 - player.luxuryRate - i) * 10}% Science)`, value: i });
  }

  showSelect({
    x: 100,
    y: 80,
    options,
    selectedIndex: player.taxRate,
    onSelect: (rate: number) => {
      pushUiAction({ type: 'SetTaxRate', player: localPlayer, rate });
    },
  });
};

const luxuryRate = () => {
  const { gameState, localPlayer } = getUiState();
  const player = gameState.players[localPlayer];
  const options: UiSelectOption<number>[] = [];

  for (let i = 0; i <= 10 - player.taxRate; i++) {
    options.push({ label: `${i * 10}% Luxuries, (${(10 - player.taxRate - i) * 10}% Science)`, value: i });
  }

  showSelect({
    x: 100,
    y: 80,
    options,
    selectedIndex: player.taxRate,
    onSelect: (rate: number) => {
      pushUiAction({ type: 'SetLuxuryRate', player: localPlayer, rate });
    },
  });
};

const loadGame = () => {
  const compressed = localStorage.getItem('CIV_GAME');
  if (!compressed) {
    void showAdvisorModal({
      advisor: Advisors.Domestic,
      body: ['No game saved.'],
    });
    return;
  }

  const decompressed = lzwDecode(compressed);
  updateUiState('gameState', JSON.parse(decompressed) as GameState);

  void showAdvisorModal({
    advisor: Advisors.Domestic,
    body: ['Game loaded!'],
  });
};

const saveGame = () => {
  const orig = JSON.stringify(getUiState().gameState);
  const compressed = lzwEncode(orig);
  const decompressed = lzwDecode(compressed);

  if (orig === decompressed) {
    localStorage.setItem('CIV_GAME', compressed);
    void showAdvisorModal({
      advisor: Advisors.Domestic,
      body: ['Game saved!', 'Stored in browser'],
    });
  } else {
    void showAdvisorModal({
      advisor: Advisors.Domestic,
      body: ['Failed to save game!', 'Compressed data did not', 'pass integrity test.'],
    });
  }
};

const revolution = () => {
  showSelect({
    x: 65,
    y: 80,
    title: 'Are you sure you want a REVOLUTION?',
    bullet: '_',
    options: [
      { value: 'NO', label: 'No thanks.' },
      { value: 'YES', label: 'Yes, we need a new government.' },
    ],
    onSelect: (val) => {
      if (val !== 'YES') {
        return;
      }
      const { gameState, localPlayer } = getUiState();
      const player = gameState.players[localPlayer];
      const civ = player.civ;
      const [city] = player.cities;

      pushUiAction({ type: 'Revolution', player: getUiState().localPlayer });
      void showNewspaper({
        city: city,
        headline: ['The ' + civ.namePlural + ' are', 'revolting! Citizens', 'demand new govt.'],
      });
    },
  });
};

export const menuWindow: UiWindow = {
  area: {
    x: 0,
    y: 0,
    width: 320,
    height: 12,
  },
  isDirty: false,
  onRender: () => {
    for (let i = 0; i < menus.length; i++) {
      const label = menus[i].label;
      let offsetX = menus[i].offsetX;
      offsetX = renderText(fonts.main, label.charAt(0), offsetX, 1, palette.white);
      renderText(fonts.main, label.slice(1), offsetX, 1, palette.grayLight);
    }
  },
  onClick: (x) => {
    let menuIndex = 0;

    while (x > menus[menuIndex].offsetX && menuIndex < menus.length - 1) {
      const nextX = menuIndex > menus.length - 2 ? 320 : menus[menuIndex + 1].offsetX;
      if (x < nextX) {
        break;
      }
      menuIndex++;
    }

    const menu = menus[menuIndex];
    showSelect({
      x: menu.offsetX,
      y: 8,
      options: menu.options,
      onSelect: (val) => {
        console.log(val);
        switch (val) {
          case MenuKey.LoadGame:
            loadGame();
            break;
          case MenuKey.SaveGame:
            saveGame();
            break;
          case MenuKey.Revolution:
            uiRender();
            revolution();
            break;
          case MenuKey.TaxRate:
            uiRender();
            taxRate();
            break;
          case MenuKey.LuxuriesRate:
            uiRender();
            luxuryRate();
            break;
        }
      },
    });
  },
};
