import { inputMappingWorldView } from '../input-mapping';
import { UiScreen } from './ui-controller';
import { pushUiEvent } from './ui-event-queue';
import { unitInfoWindow } from './ui-worldview-unit-info';
import { empireInfoWindow } from './ui-worldview-empire-info';
import { minimapWindow } from './ui-worldview-minimap';
import { mapWindow } from './ui-worldview-map';

export const uiWorldView: UiScreen = {
  onKey: (keyCode: string) => {
    const event = inputMappingWorldView[keyCode];
    if (event) {
      pushUiEvent(event);
    }
  },
  windows: [unitInfoWindow, empireInfoWindow, minimapWindow, mapWindow],
};
