export type PlayerState = {
  color: string;
  name: string;
};

export type GameState = {
  playerState: PlayerState[];
};
