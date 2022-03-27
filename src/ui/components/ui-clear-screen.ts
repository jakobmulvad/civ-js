import { clearScreen } from '../../renderer';
import { UiWindow } from '../ui-controller';

export const clearScreenWindow: UiWindow = {
  isDirty: true,
  onRender: () => {
    clearScreen();
  },
};
