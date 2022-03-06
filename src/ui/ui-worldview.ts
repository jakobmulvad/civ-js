import { Action, pushAction } from "../action";
import { isAnimating } from "../animation";
import { GameState } from "../game-state";
import { inputMapping, UiInput } from "../input";
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

const inputToAction = (input: UiInput): Action | undefined => {
  const player = 0; // for now assume local player is index zero
  const unit = state.players[0].selectedUnit; // player always operates on selected unit

  switch (input) {
    case UiInput.UnitMoveNorth:
      return { type: "UnitMove", dx: 0, dy: -1, player, unit };

    case UiInput.UnitMoveNorthEast:
      return { type: "UnitMove", dx: 1, dy: -1, player, unit };

    case UiInput.UnitMoveEast:
      return { type: "UnitMove", dx: 1, dy: 0, player, unit };

    case UiInput.UnitMoveSouthEast:
      return { type: "UnitMove", dx: 1, dy: 1, player, unit };

    case UiInput.UnitMoveSouth:
      return { type: "UnitMove", dx: 0, dy: 1, player, unit };

    case UiInput.UnitMoveSouthWest:
      return { type: "UnitMove", dx: -1, dy: 1, player, unit };

    case UiInput.UnitMoveWest:
      return { type: "UnitMove", dx: -1, dy: 0, player, unit };

    case UiInput.UnitMoveNorthWest:
      return { type: "UnitMove", dx: -1, dy: -1, player, unit };

    case UiInput.UnitWait:
      return { type: "UnitWait", player, unit };

    case UiInput.UnitNoOrders:
      return { type: "UnitNoOrders", player, unit };

    case UiInput.EndTurn:
      return { type: "EndTurn", player };

    default:
      return undefined;
  }
};

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

const handleInput = (input: UiInput) => {
  // push to action queue
  const action = inputToAction(input);
  if (action) {
    pushAction(action);
    return;
  }

  if (isAnimating()) {
    return;
  }

  switch (input) {
    case UiInput.UnitCenter: {
      if (state.playerInTurn !== 0) {
        return;
      }

      const player = state.players[state.playerInTurn];
      if (player.selectedUnit === -1) {
        return;
      }

      const unit = player.units[player.selectedUnit];
      return centerViewport(unit.x, unit.y);
    }
  }

  /*switch (input) {
    case UiInput.UnitMoveNorth:
      
      return handleMoveUnit(0, -1);
    case UiInput.UnitMoveNorthEast:
      return handleMoveUnit(1, -1);
    case UiInput.UnitMoveEast:
      return handleMoveUnit(1, 0);
    case UiInput.UnitMoveSouthEast:
      return handleMoveUnit(1, 1);
    case UiInput.UnitMoveSouth:
      return handleMoveUnit(0, 1);
    case UiInput.UnitMoveSouthWest:
      return handleMoveUnit(-1, 1);
    case UiInput.UnitMoveWest:
      return handleMoveUnit(-1, 0);
    case UiInput.UnitMoveNorthWest:
      return handleMoveUnit(-1, -1);
    case UiInput.UnitNoOrders:
      return handleNoOrder();
    case UiInput.EndTurn:
      return endTurn();
    case UiInput.UnitCenter: {
      const player = state.players[state.playerInTurn];

      if (player.selectedUnit === -1) {
        return;
      }

      const unit = player.units[player.selectedUnit];
      return centerViewport(unit.x, unit.y);
    }
    case UiInput.UnitWait: {
      //return selectNextUnit();
    }

    default:
      console.log("Unhandled game input: ", input);
  }*/
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

    const input = inputMapping[keyCode];
    if (input) {
      handleInput(input);
    }
  },
  onClick: (x: number, y: number) => {
    const relX = x - viewport.screenX;
    const relY = y - viewport.screenY;

    centerViewport(viewport.x + (relX >> 4), viewport.y + (relY >> 4));
  },
};
