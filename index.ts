import { waitForAssets } from './src/assets';
import { newGame } from './src/game-controller';

waitForAssets().then(newGame, (err) => console.error(err));
