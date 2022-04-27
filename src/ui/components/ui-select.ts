import { Font, fonts, measureText } from '../../fonts';
import { clamp, isInside, Rect } from '../../helpers';
import { KeyCode } from '../../key-codes';
import { palette } from '../../palette';
import { renderGrayBoxWithBorder, renderSelectionBox, renderText } from '../../renderer';
import { popUiScreen, pushUiScreen, UiScreen, UiWindow } from '../ui-controller';

export type UiSelectValuePair<T = any> = {
  value: T;
  label: string;
};

export type UiSelectOption<T = any> = UiSelectValuePair<T> | string | number;

export type UiSelectConfig<T = any> = {
  x: number;
  y: number;
  title?: string | string[];
  options?: UiSelectOption<T>[];
  onSelect?: (value: T) => void;
  onClose?: () => void;
  font?: Font;
  selectedIndex?: number;
  bullet?: string;
};

const getOptionLabel = (option: UiSelectOption) => {
  if (typeof option === 'object') {
    return option.label;
  }
  return option.toString();
};

export const newSelect = (config: UiSelectConfig): UiScreen => {
  const { x, y, options, bullet, onSelect, onClose } = config;
  const font = config.font ?? fonts.main;
  let selectedIndex = Math.max(0, config.selectedIndex ?? 0);

  const title = config.title ?? [];
  const titles = Array.isArray(title) ? title : [title];

  let maxLength = 0;
  let height = 0;
  for (const t of titles) {
    maxLength = Math.max(maxLength, measureText(font, t));
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

      let yOffset = y + 4;
      for (const title of titles) {
        renderText(font, title, x + 4, yOffset, palette.white);
        yOffset += font.height;
      }
      if (options) {
        renderSelectionBox(
          x + 3,
          y + 3 + (selectedIndex + titles.length) * font.height,
          boxRect.width - 6,
          font.height
        );
        const xOffset = bullet ? x + 14 : x + 10;
        for (let i = 0; i < options.length; i++) {
          if (bullet) {
            renderText(font, bullet, x + 4, yOffset + font.height * i, palette.black);
          }
          renderText(font, getOptionLabel(options[i]), xOffset, yOffset + font.height * i, palette.black);
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

      popUiScreen();
      if (typeof option === 'object') {
        onSelect?.(option.value);
      } else {
        onSelect?.(option);
      }
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
            popUiScreen();
            onClose?.();
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

          popUiScreen();
          if (typeof option === 'object') {
            onSelect?.(option.value);
          } else {
            onSelect?.(option);
          }
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

export const showSelect = (config: UiSelectConfig) => {
  const select = newSelect(config);
  pushUiScreen(select);
};
