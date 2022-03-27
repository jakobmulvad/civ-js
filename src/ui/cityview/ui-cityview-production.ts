import { incrementPerIcon, isInside, Rect } from '../../helpers';
import { KeyCode } from '../../key-codes';
import { totalCityYield } from '../../logic/city';
import { UnitPrototypeId, unitPrototypeMap } from '../../logic/units';
import { palette } from '../../palette';
import { renderBlueBox, renderSmallButton, renderUnitPrototype, renderYield, YieldIcon } from '../../renderer';
import { newSelect } from '../components/ui-select';
import { pushUiAction } from '../ui-action-queue';
import { pushUiScreen, UiWindow } from '../ui-controller';
import { getUiState } from '../ui-state';

const area: Rect = {
  x: 230,
  y: 99,
  width: 88,
  height: 90,
};

const changeButton = {
  x: 1,
  y: 7,
  width: 33,
  height: 9,
};

const buyButton = {
  x: 64,
  y: 7,
  width: 18,
  height: 9,
};

const change = () => {
  const { gameState, selectedCity, localPlayer } = getUiState();
  if (!selectedCity) {
    return;
  }

  const prototypes = Object.entries(unitPrototypeMap);
  const shieldYield = totalCityYield(gameState, gameState.players[selectedCity.owner].map, selectedCity).shields;
  const options = prototypes.map(([key, proto]) => {
    const turns = Math.max(1, Math.ceil((proto.cost - selectedCity.shields) / shieldYield));
    return { key, label: `${proto.name} (${turns} turns, ADM:${proto.attack}/${proto.defense}/${proto.moves})` };
  });

  const cityIndex = gameState.players[localPlayer].cities.indexOf(selectedCity);

  const select = newSelect({
    x: 80,
    y: 18,
    selectedIndex: options.findIndex((o) => o.key === selectedCity.producing.toString()),
    title: `What shall we build in ${selectedCity.name}?`,
    options,
    onSelect: (key) => {
      pushUiAction({
        type: 'CitySelectProduction',
        player: localPlayer,
        city: cityIndex,
        newProduction: key as UnitPrototypeId,
      });
    },
  });
  pushUiScreen(select);
};

export const cityProductionWindow: UiWindow = {
  area,
  isDirty: true,
  onRender: (state) => {
    const { selectedCity } = state;
    if (!selectedCity) {
      return;
    }
    const prototype = unitPrototypeMap[selectedCity.producing];
    const shieldsPerRow = 10 * Math.ceil(prototype.cost / 100);
    const rows = Math.ceil(prototype.cost / shieldsPerRow);
    const inc = incrementPerIcon(shieldsPerRow, area.width);

    renderBlueBox(area.x, area.y, 3 + 8 + inc * (shieldsPerRow - 1), 19 + rows * 8, [17, 1, 1, 1]);

    let shields = selectedCity.shields;
    let offsetY = area.y + 17;
    while (shields > 0) {
      renderYield(YieldIcon.Shield, Math.min(shieldsPerRow, shields), area.x + 2, offsetY, inc);
      shields -= selectedCity.size + 1;
      offsetY += 8;
    }

    renderSmallButton(
      'Change',
      area.x + changeButton.x,
      area.y + changeButton.y,
      changeButton.width,
      palette.blue,
      palette.blueDark
    );
    renderSmallButton(
      'Buy',
      area.x + buyButton.x,
      area.y + buyButton.y,
      buyButton.width,
      palette.blue,
      palette.blueDark
    );
    renderUnitPrototype(selectedCity.producing, selectedCity.owner, area.x + 36, area.y + 1);
  },
  onClick: (x, y) => {
    if (isInside(buyButton, x, y)) {
      console.log('BUY');
      return;
    }

    if (isInside(changeButton, x, y)) {
      change();
      return;
    }
  },
  onKey: (keyCode: KeyCode) => {
    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
    switch (keyCode) {
      case KeyCode.KeyC:
        change();
        break;
    }
  },
};
