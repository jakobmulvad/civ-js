import { Keys } from '../keys';
import { popUiScreen, UiScreen } from './ui-controller';
import { pushUiAction } from './ui-action-queue';
import { unitInfoWindow } from './ui-worldview-unit-info';
import { empireInfoWindow } from './ui-worldview-empire-info';
import { minimapWindow } from './ui-worldview-minimap';
import { centerViewport, ensureSelectedUnitIsInViewport, mapWindow } from './ui-worldview-map';
import { cityBottomButtonsWindow } from './cityview/ui-cityview-bottom-buttons';
import { clearScreen } from '../renderer';
import { cityCitizensWindow } from './cityview/ui-cityview-citizens';
import { cityResourcesWindow } from './cityview/ui-cityview-resources';
import { cityFoodWindow } from './cityview/ui-cityview-food';
import { cityUnitsWindow } from './cityview/ui-cityview-units';
import { cityInfoWindow } from './cityview/ui-cityview-info';
import { cityMapWindow } from './cityview/ui-cityview-map';
import { cityBuildingsWindow } from './cityview/ui-cityview-buildings';
import { cityProductionWindow } from './cityview/ui-cityview-production';
import { getUiState } from './ui-state';
import { getTerrainAt } from '../logic/map';

export const uiWorldScreen: UiScreen = {
  onKey: (keyCode: string) => {
    const { localPlayer: player, gameState } = getUiState();
    const unit = gameState.players[player].selectedUnit;

    if (keyCode === Keys.Enter || (keyCode === Keys.NumpadEnter && unit === undefined)) {
      pushUiAction({ type: 'EndTurn', player });
    }

    if (unit === undefined) {
      return;
    }

    // Handle selected unit action
    ensureSelectedUnitIsInViewport();

    switch (keyCode) {
      case Keys.ArrowUp:
      case Keys.Numpad8:
        pushUiAction({ type: 'UnitMove', player, unit, dx: 0, dy: -1 });
        return;

      case Keys.Numpad9:
        pushUiAction({ type: 'UnitMove', player, unit, dx: 1, dy: -1 });
        return;

      case Keys.ArrowRight:
      case Keys.Numpad6:
        pushUiAction({ type: 'UnitMove', player, unit, dx: 1, dy: 0 });
        return;

      case Keys.Numpad3:
        pushUiAction({ type: 'UnitMove', player, unit, dx: 1, dy: 1 });
        return;

      case Keys.ArrowDown:
      case Keys.Numpad2:
        pushUiAction({ type: 'UnitMove', player, unit, dx: 0, dy: 1 });
        return;

      case Keys.Numpad1:
        pushUiAction({ type: 'UnitMove', player, unit, dx: -1, dy: 1 });
        return;

      case Keys.ArrowLeft:
      case Keys.Numpad4:
        pushUiAction({ type: 'UnitMove', player, unit, dx: -1, dy: 0 });
        return;

      case Keys.Numpad7:
        pushUiAction({ type: 'UnitMove', player, unit, dx: -1, dy: -1 });
        return;

      case Keys.KeyW:
        pushUiAction({ type: 'UnitWait', player, unit });
        return;

      case Keys.Space:
        pushUiAction({ type: 'UnitNoOrders', player, unit });
        return;

      case Keys.KeyF:
        pushUiAction({ type: 'UnitFortify', player, unit });
        return;

      case Keys.KeyI: {
        const selectedUnit = gameState.players[player].units[unit];
        const terrain = getTerrainAt(gameState.masterMap, selectedUnit.x, selectedUnit.y);
        if (terrain.canIrrigate) {
          pushUiAction({ type: 'UnitBuildIrrigation', player, unit });
          return;
        }
        if (terrain.clearsTo !== undefined) {
          pushUiAction({ type: 'UnitClear', player, unit });
        }
        return;
      }

      case Keys.KeyM:
        pushUiAction({ type: 'UnitBuildMine', player, unit });
        return;

      case Keys.KeyR:
        pushUiAction({ type: 'UnitBuildRoad', player, unit });
        return;

      case Keys.KeyB:
        pushUiAction({ type: 'UnitBuildOrJoinCity', player, unit });
        return;

      case Keys.KeyC: {
        const selectedUnit = gameState.players[player].units[unit];
        centerViewport(selectedUnit.x, selectedUnit.y);
        return;
      }
    }
  },
  windows: [unitInfoWindow, empireInfoWindow, minimapWindow, mapWindow],
};

export const uiCityScreen: UiScreen = {
  onKey: (keyCode: string) => {
    switch (keyCode) {
      case Keys.Escape:
        popUiScreen();
        return;
    }
  },
  onMount: () => {
    clearScreen();
  },
  windows: [
    cityCitizensWindow,
    cityResourcesWindow,
    cityUnitsWindow,
    cityFoodWindow,
    cityMapWindow,
    cityInfoWindow,
    cityBuildingsWindow,
    cityProductionWindow,
    cityBottomButtonsWindow,
  ],
};
