// Events from the game the ui can listen for
export type GameEvent = 'GameStateUpdated' | 'BlinkingStateUpdated';

export type GameEventCallback = {
  event: GameEvent;
  callback: () => void;
};

const listeners: GameEventCallback[] = [];

export const addGameEventListener = (event: GameEvent, callback: () => void) => {
  listeners.push({ event, callback });
};

export const triggerGameEvent = (event: GameEvent) => {
  for (const listener of listeners) {
    if (listener.event === event) {
      listener.callback();
    }
  }
};
