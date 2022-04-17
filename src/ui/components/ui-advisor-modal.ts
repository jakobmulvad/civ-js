import { fonts, measureText } from '../../fonts';
import { advisorPortraitSprite, Advisors, Era } from '../../logic/advisors';
import { palette } from '../../palette';
import {
  renderGrayBoxWithBorder,
  renderHorizontalLine,
  renderSelectionBox,
  renderSprite,
  renderText,
  renderTextLines,
} from '../../renderer';
import { modalKeyHandler, pushUiScreen, UiScreen, UiWindow } from '../ui-controller';

export type UiAdvisorModalConfig = {
  advisor: Advisors;
  body: string[];
  emphasis?: string;
};

export const showAdvisorModal = (config: UiAdvisorModalConfig): Promise<void> => {
  return new Promise((res) => {
    const { advisor, body, emphasis } = config;
    const window: UiWindow = {
      isDirty: true,
      area: {
        x: 0,
        y: 0,
        width: 320,
        height: 200,
      },
      onRender: (state) => {
        const { localPlayer, gameState } = state;

        const portrait = advisorPortraitSprite(advisor, gameState.players[localPlayer].government, Era.Ancient);
        const maxWidth = Math.max(...body.map((s) => measureText(fonts.main, s)));
        renderGrayBoxWithBorder(58, 72, portrait.width + maxWidth + 12, 64);
        renderSprite(portrait, 60, 74);

        const title = `${advisor} Advisor:`;
        renderText(fonts.main, title, 104, 76, palette.white);
        renderHorizontalLine(104, 83, measureText(fonts.main, title), palette.cyan);

        renderTextLines(fonts.main, body, 104, 85, palette.white);

        if (emphasis) {
          const offset = 84 + 8 * body.length;
          renderSelectionBox(102, offset, maxWidth + 5, 8);
          renderText(fonts.main, emphasis, 110, offset + 1, palette.black);
        }
      },
    };
    const screen: UiScreen = {
      windows: [window],
      onKey: modalKeyHandler,
      onUnmount: res,
    };
    pushUiScreen(screen);
  });
};
