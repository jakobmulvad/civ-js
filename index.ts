import { loadAllAssets } from "./src/assets";
import { newGame, onFrame } from "./src/game-controller";

loadAllAssets().then(newGame, (err) => console.error(err));
