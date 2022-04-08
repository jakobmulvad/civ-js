import { clearScreen } from '../../renderer';
import { popUiScreen, UiWindow } from '../ui-controller';

export const clearScreenWindow: UiWindow = {
  isDirty: true,
  area: {
    x: 0,
    y: 0,
    width: 320,
    height: 200,
  },
  onRender: () => {
    clearScreen();
  },
  onClick: () => {
    popUiScreen();
  },
};
