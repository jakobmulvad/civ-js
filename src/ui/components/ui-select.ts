import { Font, fonts, measureText } from '../../fonts';
import { clamp, isInside, Rect } from '../../helpers';
import { KeyCode } from '../../key-codes';
import { palette } from '../../palette';
import { renderFrame, renderGrayBox, renderSelectionBox, renderText, setFontColor } from '../../renderer';
import { popUiScreen, UiScreen, UiWindow } from '../ui-controller';

export type UiSelectOption<T = number | string> = {
  key: T;
  label: string;
};

export type UiSelectConfig<T = number | string> = {
  x: number;
  y: number;
  title: string;
  options: UiSelectOption<T>[];
  onSelect: (key: T) => void;
  onCancel?: () => void;
  font?: Font;
  selectedIndex?: number;
};

export const newSelect = (config: UiSelectConfig): UiScreen => {
  const { x, y, title, options, onSelect, onCancel } = config;
  const font = config.font ?? fonts.main;
  let selectedIndex = config.selectedIndex ?? 0;

  let maxLength = measureText(font, title);
  for (const { label } of options) {
    maxLength = Math.max(maxLength, measureText(font, label));
  }

  const boxRect: Rect = {
    x,
    y,
    width: maxLength + 15,
    height: (options.length + 2) * font.height + 2,
  };

  const window: UiWindow = {
    area: { x: 0, y: 0, width: 320, height: 200 },
    isDirty: true,
    onRender: () => {
      renderFrame(x, y, boxRect.width, boxRect.height, palette.black);
      renderGrayBox(x + 1, y + 1, maxLength + 13, (options.length + 2) * font.height);

      renderSelectionBox(x + 3, y + 3 + (selectedIndex + 1) * font.height, boxRect.width - 6, font.height);

      setFontColor(font, palette.white);
      renderText(font, title, x + 4, y + 4);
      setFontColor(font, palette.black);
      for (let i = 0; i < options.length; i++) {
        renderText(font, options[i].label, x + 10, y + 4 + font.height * (i + 1));
      }
    },
    onMouseDown: (x, y) => {
      window.onMouseDrag?.(x, y);
    },
    onClick: (x, y) => {
      if (!isInside(boxRect, x, y)) {
        onCancel?.();
        popUiScreen();
        return;
      }

      onSelect(options[selectedIndex].key);
      popUiScreen();
    },
    onMouseDrag: (x, y) => {
      if (!isInside(boxRect, x, y)) {
        return;
      }

      const offsetY = y - boxRect.y - 4 - font.height;
      selectedIndex = clamp(0, Math.floor(offsetY / font.height), options.length - 1);
      window.isDirty = true;
    },
  };

  return {
    windows: [window],
    onKey: (keyCode: KeyCode) => {
      // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
      switch (keyCode) {
        case KeyCode.ArrowUp:
          selectedIndex = Math.max(0, selectedIndex - 1);
          window.isDirty = true;
          break;
        case KeyCode.ArrowDown:
          selectedIndex = Math.min(options.length - 1, selectedIndex + 1);
          window.isDirty = true;
          break;
        case KeyCode.Enter:
        case KeyCode.NumpadEnter:
          onSelect(options[selectedIndex].key);
          popUiScreen();
          break;
        case KeyCode.Escape:
          onCancel?.();
          popUiScreen();
          break;
      }
    },
  };
};
