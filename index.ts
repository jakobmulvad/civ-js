import { loadAllAssets } from "./src/assets";
import { newGame } from "./src/game-controller";

loadAllAssets().then(newGame, (err) => console.error(err));
