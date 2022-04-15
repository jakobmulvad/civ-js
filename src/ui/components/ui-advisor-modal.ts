import { Sprite } from '../../assets';
import { fonts, measureText } from '../../fonts';
import { palette } from '../../palette';
import {
  renderGrayBoxWithBorder,
  renderHorizontalLine,
  renderSelectionBox,
  renderSprite,
  renderText,
  renderTextLines,
  setFontColor,
} from '../../renderer';
import { modalKeyHandler, UiScreen, UiWindow } from '../ui-controller';

export type UiAdvisorModalConfig = {
  title: string;
  body: string[];
  emphasis: string;
  onClose?: () => void;
};

const advisorPortraitSprite: Sprite = {
  asset: 'govt0a.pic.gif',
  x: 0,
  y: 0,
  width: 40,
  height: 60,
};

export const newAdvisorModal = (config: UiAdvisorModalConfig): UiScreen => {
  const { title, body, emphasis, onClose } = config;
  const window: UiWindow = {
    isDirty: true,
    area: {
      x: 0,
      y: 0,
      width: 320,
      height: 200,
    },
    onRender: () => {
      const maxWidth = Math.max(...body.map((s) => measureText(fonts.main, s)));
      renderGrayBoxWithBorder(58, 72, advisorPortraitSprite.width + maxWidth + 12, 64);
      renderSprite(advisorPortraitSprite, 60, 74);

      setFontColor(fonts.main, palette.white);
      renderText(fonts.main, title, 104, 76);
      renderHorizontalLine(104, 83, measureText(fonts.main, title), palette.cyan);

      renderTextLines(fonts.main, body, 104, 85);

      const offset = 84 + 8 * body.length;
      renderSelectionBox(102, offset, maxWidth + 5, 8);
      setFontColor(fonts.main, palette.black);
      renderText(fonts.main, emphasis, 110, offset + 1);
    },
  };
  return {
    windows: [window],
    onKey: modalKeyHandler(onClose),
  };
};
