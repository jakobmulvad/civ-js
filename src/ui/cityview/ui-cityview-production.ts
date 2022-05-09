import { fonts } from '../../fonts';
import { addGameEventListener } from '../../game-event';
import { clamp, incrementPerIcon, isInside, Rect } from '../../helpers';
import { KeyCode } from '../../key-codes';
import { Building, BuildingId, buildings } from '../../logic/buildings';
import { buyCost, CityProduction, CityProductionType, getProductionObject, totalCityYield } from '../../logic/city';
import { UnitPrototype, UnitPrototypeId, unitPrototypeMap } from '../../logic/units';
import { palette } from '../../palette';
import {
  renderBlueBox,
  renderSmallButton,
  renderText,
  renderUnitPrototype,
  renderYield,
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
  const player = gameState.players[localPlayer];
  const shieldYield = totalCityYield(gameState, gameState.players[selectedCity.owner].map, selectedCity).shields;

  const turns = (cost: number) => clamp(1, Math.ceil((cost - selectedCity.shields) / shieldYield), cost);

  // Add units
  const unitPrototypes = Object.entries(unitPrototypeMap) as [UnitPrototypeId, UnitPrototype][];
  const unitOptions: UiSelectValuePair<CityProduction>[] = unitPrototypes
    .filter(([, unitProto]) => {
      if (unitProto.requires && !player.advances.includes(unitProto.requires)) {
        return false;
      }
      if (unitProto.obsoleteBy && player.advances.includes(unitProto.obsoleteBy)) {
        return false;
      }
      return true;
    })
    .map(([key, proto]) => {
      return {
        value: {
          type: CityProductionType.Unit,
          id: key,
        },
        label: `${proto.name} (${turns(proto.cost)} turns, ADM:${proto.attack}/${proto.defense}/${proto.moves})`,
      };
    });

  // Add buildings
  const buildingEntries = Object.entries(buildings) as [BuildingId, Building][];
  const buildingOptions: UiSelectValuePair<CityProduction>[] = buildingEntries
    .filter(([key, building]) => {
      if (selectedCity.buildings.includes(key)) {
        return false;
      }
      if (building.requires && !player.advances.includes(building.requires)) {
        return false;
      }
      return true;
    })
    .map(([key, building]) => {
      return {
        value: {
          type: CityProductionType.Building,
          id: key,
        },
        label: `${building.name} (${turns(building.cost)} turns)`,
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
    font: options.length > 10 ? fonts.mainSmall : fonts.main,
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
  const name = getProductionObject(selectedCity.producing).name;
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
    const cost = getProductionObject(selectedCity.producing).cost;
    const shieldsPerRow = 10 * Math.ceil(Math.max(cost, selectedCity.shields) / 100);
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
        renderText(fonts.mainSmall, building.name, area.x + (area.width >> 1), area.y + 1, palette.white, true);
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
