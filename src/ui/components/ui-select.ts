import { Font, fonts, measureText } from '../../fonts';
import { clamp, isInside, Rect } from '../../helpers';
import { KeyCode } from '../../key-codes';
import { palette } from '../../palette';
import { renderGrayBoxWithBorder, renderSelectionBox, renderText, setFontColor } from '../../renderer';
import { popUiScreen, UiScreen, UiWindow } from '../ui-controller';

export type UiSelectValuePair<T = any> = {
  value: T;
  label: string;
};

export type UiSelectOption<T = any> = UiSelectValuePair<T> | string | number;

export type UiSelectConfig<T = any> = {
  x: number;
  y: number;
  title: string | string[];
  options?: UiSelectOption<T>[];
  onSelect?: (value: T) => void;
  onClose?: () => void;
  font?: Font;
  selectedIndex?: number;
};

const getOptionLabel = (option: UiSelectOption) => {
  if (typeof option === 'object') {
    return option.label;
  }
  return option.toString();
};

export const newSelect = (config: UiSelectConfig): UiScreen => {
  const { x, y, options, onSelect, onClose } = config;
  const font = config.font ?? fonts.main;
  let selectedIndex = config.selectedIndex ?? 0;

  const titles = Array.isArray(config.title) ? config.title : [config.title];

  let maxLength = 0;
  let height = 0;
  for (const title of titles) {
    maxLength = Math.max(maxLength, measureText(font, title));
    height += font.height;
  }
  if (options) {
    for (const option of options) {
      maxLength = Math.max(maxLength, measureText(font, getOptionLabel(option)));
      height += font.height;
    }
  }

  const boxRect: Rect = {
    x,
    y,
    width: maxLength + 15,
    height: height + font.height + 2,
  };

  const window: UiWindow = {
    area: { x: 0, y: 0, width: 320, height: 200 },
    isDirty: true,
    onRender: () => {
      renderGrayBoxWithBorder(x, y, boxRect.width, boxRect.height);
      //renderFrame(x, y, boxRect.width, boxRect.height, palette.black);
      //renderGrayBox(x + 1, y + 1, boxRect.width - 2, boxRect.height - 2);

      setFontColor(font, palette.white);
      let yOffset = y + 4;
      for (const title of titles) {
        renderText(font, title, x + 4, yOffset);
        yOffset += font.height;
      }
      if (options) {
        renderSelectionBox(
          x + 3,
          y + 3 + (selectedIndex + titles.length) * font.height,
          boxRect.width - 6,
          font.height
        );
        setFontColor(font, palette.black);
        for (let i = 0; i < options.length; i++) {
          renderText(font, getOptionLabel(options[i]), x + 10, yOffset + font.height * i);
        }
      }
    },
    onMouseDown: (x, y) => {
      window.onMouseDrag?.(x, y);
    },
    onClick: (x, y) => {
      if (!isInside(boxRect, x, y) || !options) {
        onClose?.();
        popUiScreen();
        return;
      }

      const option = options[selectedIndex];

      if (typeof option === 'object') {
        onSelect?.(option.value);
      } else {
        onSelect?.(option);
      }

      popUiScreen();
    },
    onMouseDrag: (x, y) => {
      if (!isInside(boxRect, x, y) || !options) {
        return;
      }

      const offsetY = y - boxRect.y - 4 - titles.length * font.height;
      selectedIndex = clamp(0, Math.floor(offsetY / font.height), options.length - 1);
      window.isDirty = true;
    },
  };

  return {
    windows: [window],
    onKey: (keyCode: KeyCode) => {
      if (!options) {
        // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
        switch (keyCode) {
          case KeyCode.Enter:
          case KeyCode.Escape:
          case KeyCode.NumpadEnter:
          case KeyCode.Space:
            onClose?.();
            popUiScreen();
            break;
        }
        return;
      }

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
        case KeyCode.NumpadEnter: {
          const option = options[selectedIndex];

          if (typeof option === 'object') {
            onSelect?.(option.value);
          } else {
            onSelect?.(option);
          }
          popUiScreen();
          break;
        }
        case KeyCode.Escape:
          onClose?.();
          popUiScreen();
          break;
      }
    },
  };
};
