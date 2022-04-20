import { fonts } from '../../fonts';
import { Advisors } from '../../logic/advisors';
import { GameState } from '../../logic/game-state';
import { palette } from '../../palette';
import { renderText } from '../../renderer';
import { lzwDecode, lzwEncode } from '../../util/lzw-compression';
import { showAdvisorModal } from '../components/ui-advisor-modal';
import { UiWindow } from '../ui-controller';
import { getUiState, updateUiState } from '../ui-state';

export const menuWindow: UiWindow = {
  area: {
    x: 0,
    y: 0,
    width: 320,
    height: 12,
  },
  isDirty: false,
  onRender: () => {
    renderText(fonts.main, 'LOAD', 10, 1, palette.grayLight);
    renderText(fonts.main, 'SAVE', 50, 1, palette.grayLight);
  },
  onClick: (x) => {
    if (x > 10 && x < 40) {
      const compressed = localStorage.getItem('CIV_GAME');
      if (!compressed) {
        void showAdvisorModal({
          advisor: Advisors.Domestic,
          body: ['No game saved.'],
        });
        return;
      }

      const decompressed = lzwDecode(compressed);
      updateUiState('gameState', JSON.parse(decompressed) as GameState);

      void showAdvisorModal({
        advisor: Advisors.Domestic,
        body: ['Game loaded!'],
      });
      return;
    }
    if (x > 50 && x < 80) {
      const orig = JSON.stringify(getUiState().gameState);
      const compressed = lzwEncode(orig);
      const decompressed = lzwDecode(compressed);

      if (orig === decompressed) {
        localStorage.setItem('CIV_GAME', compressed);
        void showAdvisorModal({
          advisor: Advisors.Domestic,
          body: [
            'Game saved!',
            'Stored in browser localStorage',
            `Compression rate: ${Math.round((compressed.length * 100) / orig.length)}%`,
          ],
        });
      } else {
        void showAdvisorModal({
          advisor: Advisors.Domestic,
          body: ['Failed to save game!', 'Compressed data did not', 'pass integrity test.'],
        });
      }

      return;
    }
  },
};
