// Events from the game the ui can listen for
export type GameEvent = 'GameStateUpdated' | 'BlinkingStateUpdated' | 'ViewportChanged' | 'CityViewUpdated';

export type GameEventCallback = {
  event: GameEvent;
  callback: () => void;
};

const listeners: GameEventCallback[] = [];

export const addGameEventListener = (event: GameEvent | GameEvent[], callback: () => void) => {
  if (Array.isArray(event)) {
    for (const evt of event) {
      listeners.push({ event: evt, callback });
    }
    return;
  }
  listeners.push({ event, callback });
};

export const triggerGameEvent = (event: GameEvent) => {
  for (const listener of listeners) {
    if (listener.event === event) {
      listener.callback();
    }
  }
};
