import { loadAllAssets } from "./src/assets";
import { newGame, onFrame } from "./src/game-controller";

const frameHandler = (time: number) => {
  requestAnimationFrame(frameHandler);
  onFrame(time);
};
requestAnimationFrame(frameHandler);

loadAllAssets().then(newGame, (err) => console.error(err));
