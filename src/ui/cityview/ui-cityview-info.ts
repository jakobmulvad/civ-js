import { getImageAsset } from '../../assets';
import { fonts } from '../../fonts';
import { Rect } from '../../helpers';
import { City } from '../../logic/city';
import { GameState, getUnitsAt } from '../../logic/game-state';
import { palette } from '../../palette';
import { renderBlueBox, renderSmallButton, renderText, renderUnit, setFontColor } from '../../renderer';
import { UiWindow } from '../ui-controller';

const area: Rect = {
  x: 95,
  y: 106,
  width: 133,
  height: 92,
};

enum Tabs {
  Info = 'Info',
  Happy = 'Happy',
  Map = 'Map',
  View = 'View',
}

let activeTab = Tabs.Info;

const renderInfo = (state: GameState, city: City) => {
  const units = getUnitsAt(state, city.x, city.y);

  const sp257 = getImageAsset('sp257.pic.png').canvas;
  setFontColor(fonts.mainSmall, palette.black);
  for (let i = 0; i < units.length; i++) {
    const x = area.x + 5 + 17 * (i % 7);
    const y = area.y + 10 + Math.floor(i / 7) * 22;
    renderUnit(sp257, units[i], x, y);
    renderText(fonts.mainSmall, 'NON.', x, y + 15);
  }
};

export const cityInfoWindow: UiWindow = {
  area,
  isDirty: true,
  onRender: (state) => {
    const { selectedCity, gameState } = state;
    if (!selectedCity) {
      return;
    }
    renderBlueBox(area.x, area.y, area.width, area.height);

    let yOffset = 0;
    for (const tab of Object.values(Tabs)) {
      const active = activeTab === tab;
      renderSmallButton(tab, area.x + yOffset, area.y, 33, active ? palette.white : palette.blue, palette.blueDark);
      yOffset += 33;
    }

    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
    switch (activeTab) {
      case Tabs.Info:
        renderInfo(gameState, selectedCity);
        break;
    }
  },
  onMount: () => {
    activeTab = Tabs.Info;
  },
  onClick: (x, y) => {
    if (y < 10) {
      const tabIndex = Math.floor(x / 33);
      console.log(tabIndex);
      activeTab = Object.values(Tabs)[tabIndex];
      cityInfoWindow.isDirty = true;
    }
  },
};
