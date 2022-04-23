import { ImageAssetKey, Sprite } from '../assets';
import { GovernmentId } from './government';

export enum Advisors {
  Defense = 'Defense',
  Domestic = 'Domestic',
  Foreign = 'Foreign',
  Science = 'Science',
}

export const spriteOffset: Record<Advisors, number> = {
  [Advisors.Defense]: 0,
  [Advisors.Domestic]: 1,
  [Advisors.Foreign]: 2,
  [Advisors.Science]: 3,
};

export enum Era {
  Ancient = 'a',
  Modern = 'm',
}

export const advisorPortraitSprite = (advisor: Advisors, government: GovernmentId, era: Era): Sprite => {
  let sheet: number;

  switch (government) {
    case GovernmentId.Anarchy:
    case GovernmentId.Despotism:
      sheet = 0;
      break;
    case GovernmentId.Monarchy:
      sheet = 1;
      break;
    case GovernmentId.Republic:
    case GovernmentId.Democracy:
      sheet = 2;
      break;
    case GovernmentId.Communism:
      sheet = 3;
      break;
  }

  return {
    asset: `govt${sheet}${era}.pic.gif` as ImageAssetKey,
    x: spriteOffset[advisor] * 40,
    y: 0,
    width: 40,
    height: 60,
  };
};
