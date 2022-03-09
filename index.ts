import { waitForAssets } from './src/assets';
import { startGame } from './src/game-controller';

waitForAssets().then(startGame, (err) => console.error(err));
