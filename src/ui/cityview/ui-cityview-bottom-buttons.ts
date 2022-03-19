import { isInside, Rect } from '../../helpers';
import { palette } from '../../palette';
import { renderSmallButton } from '../../renderer';
import { popUiScreen, UiWindow } from '../ui-controller';

const area: Rect = {
  x: 230,
  y: 189,
  width: 88,
  height: 11,
};

const exitButton = {
  x: 54,
  y: 1,
  width: 33,
  height: 9,
};

export const cityBottomButtonsWindow: UiWindow = {
  area,
  isDirty: true,
  onRender: () => {
    renderSmallButton(
      'Exit',
      area.x + exitButton.x,
      area.y + exitButton.y,
      exitButton.width,
      palette.red,
      palette.redDark
    );
  },
  onClick: (x, y) => {
    if (isInside(exitButton, x, y)) {
      popUiScreen();
    }
  },
};
