import { randomIntBetween } from '../helpers';
import { Action } from './action';
import { GameState, getPlayerInTurn, PlayerState } from './game-state';
import { Unit, UnitState } from './units';

const aiUnitTick = (state: GameState, player: PlayerState, unit: Unit): Action | undefined => {
  const dx = randomIntBetween(-1, 2);
  const dy = randomIntBetween(-1, 2);

  if (dx === 0 && dy === 0) {
    return;
  }

  if (unit.state === UnitState.Idle) {
    return { type: 'UnitMove', player: state.playerInTurn, unit: player.units.indexOf(unit), dx, dy };
  }

  return { type: 'UnitNoOrders', player: state.playerInTurn, unit: player.units.indexOf(unit) };
};

export const aiTick = (state: GameState): Action | undefined => {
  const player = getPlayerInTurn(state);

  // First see if we have a unit to move
  const unit = player.units.find((u) => u.movesLeft > 0);
  if (unit) {
    return aiUnitTick(state, player, unit);
  }

  return { type: 'EndTurn', player: state.playerInTurn };
};
