import { KeyCode } from '../key-codes';
import { popUiScreen, UiScreen } from './ui-controller';
import { pushUiAction } from './ui-action-queue';
import { unitInfoWindow } from './ui-worldview-unit-info';
import { empireInfoWindow } from './ui-worldview-empire-info';
import { minimapWindow } from './ui-worldview-minimap';
import { centerViewport, ensureSelectedUnitIsInViewport, mapWindow } from './ui-worldview-map';
import { cityBottomButtonsWindow } from './cityview/ui-cityview-bottom-buttons';
import { cityCitizensWindow } from './cityview/ui-cityview-citizens';
import { cityResourcesWindow } from './cityview/ui-cityview-resources';
import { cityFoodWindow } from './cityview/ui-cityview-food';
import { citySupplyWindow } from './cityview/ui-cityview-supply';
import { cityInfoWindow } from './cityview/ui-cityview-info';
import { cityMapWindow } from './cityview/ui-cityview-map';
import { cityBuildingsWindow } from './cityview/ui-cityview-buildings';
import { cityProductionWindow } from './cityview/ui-cityview-production';
import { getUiState } from './ui-state';
import { getTerrainAt } from '../logic/map';
import { clearScreenWindow } from './components/ui-clear-screen';

export const uiWorldScreen: UiScreen = {
  onKey: (keyCode, shift) => {
    const { localPlayer: player, gameState } = getUiState();
    const unit = gameState.players[player].selectedUnit;

    if (keyCode === KeyCode.Enter || (keyCode === KeyCode.NumpadEnter && unit === undefined)) {
      pushUiAction({ type: 'EndTurn', player });
    }

    if (unit === undefined) {
      return;
    }

    // Handle selected unit action
    ensureSelectedUnitIsInViewport();

    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
    switch (keyCode) {
      case KeyCode.ArrowUp:
      case KeyCode.Numpad8:
        pushUiAction({ type: 'UnitMove', player, unit, dx: 0, dy: -1 });
        return;

      case KeyCode.Numpad9:
        pushUiAction({ type: 'UnitMove', player, unit, dx: 1, dy: -1 });
        return;

      case KeyCode.ArrowRight:
      case KeyCode.Numpad6:
        pushUiAction({ type: 'UnitMove', player, unit, dx: 1, dy: 0 });
        return;

      case KeyCode.Numpad3:
        pushUiAction({ type: 'UnitMove', player, unit, dx: 1, dy: 1 });
        return;

      case KeyCode.ArrowDown:
      case KeyCode.Numpad2:
        pushUiAction({ type: 'UnitMove', player, unit, dx: 0, dy: 1 });
        return;

      case KeyCode.Numpad1:
        pushUiAction({ type: 'UnitMove', player, unit, dx: -1, dy: 1 });
        return;

      case KeyCode.ArrowLeft:
      case KeyCode.Numpad4:
        pushUiAction({ type: 'UnitMove', player, unit, dx: -1, dy: 0 });
        return;

      case KeyCode.Numpad7:
        pushUiAction({ type: 'UnitMove', player, unit, dx: -1, dy: -1 });
        return;

      case KeyCode.KeyW:
        pushUiAction({ type: 'UnitWait', player, unit });
        return;

      case KeyCode.Space:
        pushUiAction({ type: 'UnitNoOrders', player, unit });
        return;

      case KeyCode.KeyF:
        pushUiAction({ type: 'UnitFortify', player, unit });
        return;

      case KeyCode.KeyD:
        if (shift) {
          pushUiAction({ type: 'UnitDisband', player, unit });
        }
        return;

      case KeyCode.KeyI: {
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

      case KeyCode.KeyM:
        pushUiAction({ type: 'UnitBuildMine', player, unit });
        return;

      case KeyCode.KeyR:
        pushUiAction({ type: 'UnitBuildRoad', player, unit });
        return;

      case KeyCode.KeyB:
        pushUiAction({ type: 'UnitBuildOrJoinCity', player, unit });
        return;

      case KeyCode.KeyC: {
        const selectedUnit = gameState.players[player].units[unit];
        centerViewport(selectedUnit.x, selectedUnit.y);
        return;
      }
    }
  },
  windows: [unitInfoWindow, empireInfoWindow, minimapWindow, mapWindow],
};

export const uiCityScreen: UiScreen = {
  onKey: (keyCode: KeyCode) => {
    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
    switch (keyCode) {
      case KeyCode.Escape:
        popUiScreen();
        return;
    }
  },
  windows: [
    clearScreenWindow,
    cityCitizensWindow,
    cityResourcesWindow,
    citySupplyWindow,
    cityFoodWindow,
    cityMapWindow,
    cityInfoWindow,
    cityBuildingsWindow,
    cityProductionWindow,
    cityBottomButtonsWindow,
  ],
};
