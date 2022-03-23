import { Action } from '../logic/action';

const eventQueue: Action[] = [];

export const pushUiAction = (action: Action) => eventQueue.push(action);
export const popUiAction = () => eventQueue.pop();
export const clearUiActionQueue = () => eventQueue.slice(0, 0);
