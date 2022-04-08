// Events from the game the ui can listen for
export type GameEvent =
  | 'GameStateUpdated'
  | 'BlinkingStateUpdated'
  | 'ViewportChanged'
  | 'CityCitizensReassigned'
  | 'CityViewUpdated';

export type GameEventCallback = {
  event: GameEvent;
  callback: () => void;
};

const listeners: GameEventCallback[] = [];

export const addGameEventListener = (events: GameEvent | GameEvent[], callback: () => void) => {
  if (!Array.isArray(events)) {
    events = [events];
  }

  for (const event of events) {
    listeners.push({ event, callback });
  }
};

export const triggerGameEvent = (event: GameEvent) => {
  console.log('Event triggered', event);
  for (const listener of listeners) {
    if (listener.event === event) {
      listener.callback();
    }
  }
};
