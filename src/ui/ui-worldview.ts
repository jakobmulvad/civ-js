import { isAnimating } from "../animation";
import { endTurn, handleMoveUnit, handleNoOrder } from "../game-controller";
import { GameState } from "../game-state";
import { GameAction, keyboardMapping } from "../keyboard";
import { renderWorld } from "../renderer";
import { RenderViewport } from "../types";
import { UiScreen } from "./ui-controller";

let state: GameState;

const viewport: RenderViewport = {
  screenX: 320 - 15 * 16,
  screenY: 200 - 12 * 16,
  x: 0,
  y: 0,
  width: 15,
  height: 12,
};

/*const handleAction = async (action: GameAction, player: number): Promise<void> => {
  if (isAnimating()) {
    return;
  }

  console.log("handleAction", action, player);
  if (state.playerInTurn !== player) {
    throw new Error(`Player ${player} cannot take actions out of turn`);
  }

  switch (action) {
    case GameAction.UnitMoveNorth:
      return handleMoveUnit(0, -1);
    case GameAction.UnitMoveNorthEast:
      return handleMoveUnit(1, -1);
    case GameAction.UnitMoveEast:
      return handleMoveUnit(1, 0);
    case GameAction.UnitMoveSouthEast:
      return handleMoveUnit(1, 1);
    case GameAction.UnitMoveSouth:
      return handleMoveUnit(0, 1);
    case GameAction.UnitMoveSouthWest:
      return handleMoveUnit(-1, 1);
    case GameAction.UnitMoveWest:
      return handleMoveUnit(-1, 0);
    case GameAction.UnitMoveNorthWest:
      return handleMoveUnit(-1, -1);
    case GameAction.UnitNoOrders:
      return handleNoOrder();
    case GameAction.EndTurn:
      return endTurn();
    case GameAction.UnitCenter: {
      const player = state.players[state.playerInTurn];

      if (player.selectedUnit === -1) {
        return;
      }

      const unit = player.units[player.selectedUnit];
      return centerViewport(unit.x, unit.y);
    }
    case GameAction.UnitWait: {
      return selectNextUnit();
    }

    default:
      console.log("Unhandled game action: ", action);
  }
};*/

export const centerViewport = (x: number, y: number) => {
  const newX = x - (viewport.width >> 1);
  const newY = y - (viewport.height >> 1);
  viewport.x = (newX + state.masterMap.width) % state.masterMap.width;
  viewport.y = Math.max(0, Math.min(state.masterMap.height - viewport.height, newY));
};

export const centerViewportIfNeeded = (x: number, y: number) => {
  if (
    Math.abs(x - (viewport.x + (viewport.width >> 1))) > 5 ||
    Math.abs(y - (viewport.y + (viewport.height >> 1))) > 3
  ) {
    centerViewport(x, y);
  }
};

export const setWorldUiGameState = (gameState: GameState) => (state = gameState);

export const uiWorldView: UiScreen = {
  onRender: (time: number) => {
    renderWorld(state, time, viewport);
  },
  onKey: (keyCode: string) => {
    if (!state) {
      return;
    }

    const action = keyboardMapping[keyCode];
    if (action) {
      //handleAction(action, 0).catch((err) => console.error(`Failed to perform action ${action}:`, err));
      console.log("ignore action", action);
    }
  },
  onClick: (x: number, y: number) => {
    console.log(x, y);
    const relX = x - viewport.screenX;
    const relY = y - viewport.screenY;

    centerViewport(viewport.x + (relX >> 4), viewport.y + (relY >> 4));
  },
};
