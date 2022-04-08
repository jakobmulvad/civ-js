import { fonts } from '../../fonts';
import { addGameEventListener } from '../../game-event';
import { incrementPerIcon, isInside, Rect } from '../../helpers';
import { KeyCode } from '../../key-codes';
import { Building, BuildingId, buildings } from '../../logic/buildings';
import {
  buyCost,
  CityProduction,
  CityProductionType,
  getProductionCost,
  getProductionName,
  totalCityYield,
} from '../../logic/city';
import { UnitPrototypeId, unitPrototypeMap } from '../../logic/units';
import { palette } from '../../palette';
import {
  renderBlueBox,
  renderSmallButton,
  renderText,
  renderUnitPrototype,
  renderYield,
  setFontColor,
  YieldIcon,
} from '../../renderer';
import { newSelect, UiSelectValuePair } from '../components/ui-select';
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

let changeButtonColor = palette.blue;

const change = () => {
  const { gameState, selectedCity, localPlayer } = getUiState();
  if (!selectedCity || selectedCity.hasBought) {
    return;
  }
  const shieldYield = totalCityYield(gameState, gameState.players[selectedCity.owner].map, selectedCity).shields;

  // Add units
  const unitPrototypes = Object.entries(unitPrototypeMap);
  const unitOptions: UiSelectValuePair<CityProduction>[] = unitPrototypes.map(([key, proto]) => {
    const turns = Math.max(1, Math.ceil((proto.cost - selectedCity.shields) / shieldYield));
    return {
      value: {
        type: CityProductionType.Unit,
        id: key as UnitPrototypeId,
      },
      label: `${proto.name} (${turns} turns, ADM:${proto.attack}/${proto.defense}/${proto.moves})`,
    };
  });

  // Add buildings
  const buildingEntries = Object.entries(buildings) as [BuildingId, Building][];
  const buildingOptions: UiSelectValuePair<CityProduction>[] = buildingEntries
    .filter(([key]) => !selectedCity.buildings.includes(key))
    .map(([key, building]) => {
      const turns = Math.max(1, Math.ceil((building.cost - selectedCity.shields) / shieldYield));
      return {
        value: {
          type: CityProductionType.Building,
          id: key,
        },
        label: `${building.name} (${turns} turns)`,
      };
    });

  const options = [...unitOptions, ...buildingOptions];

  const cityIndex = gameState.players[localPlayer].cities.indexOf(selectedCity);
  const selectedIndex = options.findIndex((o) => o.value?.id === selectedCity.producing.id);

  const select = newSelect({
    x: 80,
    y: 18,
    selectedIndex,
    title: `What shall we build in ${selectedCity.name}?`,
    options,
    onSelect: (value) => {
      pushUiAction({
        type: 'CityChangeProduction',
        player: localPlayer,
        city: cityIndex,
        production: value as CityProduction,
      });
    },
  });
  pushUiScreen(select);
};

const buy = () => {
  const { gameState, selectedCity, localPlayer } = getUiState();
  if (!selectedCity || selectedCity.hasBought) {
    return;
  }
  const cityIndex = gameState.players[localPlayer].cities.indexOf(selectedCity);

  const cost = buyCost(selectedCity.producing, selectedCity.shields);
  const name = getProductionName(selectedCity.producing);
  const treasury = gameState.players[localPlayer].gold;

  const select = newSelect({
    x: 80,
    y: 80,
    title: ['Cost to complete', `${name}: $${cost}`, `Treasury: $${treasury}`],
    options: cost > treasury ? undefined : ['Yes', 'No'],
    onSelect: (key) => {
      if (key === 'Yes') {
        pushUiAction({
          type: 'CityBuy',
          player: localPlayer,
          city: cityIndex,
        });
      }
    },
  });
  pushUiScreen(select);
};

export const cityProductionWindow: UiWindow = {
  area,
  isDirty: true,
  onRender: (state) => {
    console.log('Render production');
    const { selectedCity } = state;
    if (!selectedCity) {
      return;
    }
    const cost = getProductionCost(selectedCity.producing);
    const shieldsPerRow = 10 * Math.ceil(cost / 100);
    const rows = Math.ceil(cost / shieldsPerRow);
    const inc = incrementPerIcon(shieldsPerRow, area.width);

    renderBlueBox(area.x, area.y, 3 + 8 + inc * (shieldsPerRow - 1), 19 + rows * 8, [17, 1, 1, 1]);
    area.height = 19 + rows * 8;

    let shields = selectedCity.shields;
    let offsetY = area.y + 17;
    while (shields > 0) {
      renderYield(YieldIcon.Shield, Math.min(shieldsPerRow, shields), area.x + 2, offsetY, inc);
      shields -= shieldsPerRow;
      offsetY += 8;
    }

    renderSmallButton(
      'Change',
      area.x + changeButton.x,
      area.y + changeButton.y,
      changeButton.width,
      selectedCity.hasBought ? palette.grayLight : changeButtonColor,
      selectedCity.hasBought ? palette.grayLighter : palette.blueDark
    );
    renderSmallButton(
      'Buy',
      area.x + buyButton.x,
      area.y + buyButton.y,
      buyButton.width,
      selectedCity.hasBought ? palette.grayLight : palette.blue,
      selectedCity.hasBought ? palette.grayLighter : palette.blueDark
    );

    switch (selectedCity.producing.type) {
      case CityProductionType.Unit:
        renderUnitPrototype(selectedCity.producing.id, selectedCity.owner, area.x + 36, area.y + 1);
        break;
      case CityProductionType.Building: {
        const building = buildings[selectedCity.producing.id];
        setFontColor(fonts.mainSmall, palette.white);
        renderText(fonts.mainSmall, building.name, area.x + (area.width >> 1), area.y + 1, true);
        break;
      }
    }
  },
  onClick: (x, y) => {
    if (isInside(buyButton, x, y)) {
      buy();
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

      case KeyCode.KeyB:
        buy();
        break;
    }
  },
};

addGameEventListener('GameStateUpdated', () => (cityProductionWindow.isDirty = true));
addGameEventListener('BlinkingStateUpdated', () => {
  const { selectedCity, isBlinking } = getUiState();
  if (!selectedCity) {
    return;
  }

  // Blink yellow button if producing building that city already has
  if (
    selectedCity.producing.type === CityProductionType.Building &&
    selectedCity.buildings.includes(selectedCity.producing.id)
  ) {
    changeButtonColor = isBlinking ? palette.yellow : palette.blue;
    cityProductionWindow.isDirty = true;
  } else if (changeButtonColor !== palette.blue) {
    changeButtonColor = palette.blue;
    cityProductionWindow.isDirty = true;
  }
});
