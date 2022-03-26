import { ActionWithPlayer, ActionWithUnit } from '../action';
import { GameState } from '../game-state';

export const validatePlayerAction = (state: GameState, action: ActionWithPlayer) => {
  if (action.player !== state.playerInTurn) {
    throw new Error(`Player ${action.player} cannot issue actions out of turn`);
  }
};

export const validateUnitAction = (state: GameState, action: ActionWithUnit) => {
  validatePlayerAction(state, action);

  const unit = state.players[action.player]?.units[action.unit];
  if (!unit) {
    throw new Error(`Player ${action.player} cannot issue unit action on unit ${action.unit} because it doesn't exist`);
  }

  if (unit.movesLeft === 0) {
    throw new Error(
      `Player ${action.player} cannot issue unit action on unit ${action.unit} because it doesn't have moves left`
    );
  }

  return unit;
};
