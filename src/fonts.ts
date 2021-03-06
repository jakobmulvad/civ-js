export type Font = {
  offset: number; // Offset into fonts.cv on y-axis
  width: number;
  height: number;
  kerning: number[];
};

export const fonts = {
  main: {
    offset: 0,
    width: 8,
    height: 8,
    kerning: [
      5, 2, 1, 7, 5, 5, 5, 1, 3, 4, 5, 5, 2, 5, 1, 4, 5, 4, 5, 5, 5, 5, 5, 5, 5, 5, 2, 2, 5, 5, 5, 5, 8, 6, 6, 6, 6, 6,
      6, 6, 6, 4, 6, 6, 6, 7, 6, 6, 6, 6, 6, 6, 6, 6, 7, 7, 6, 6, 6, 3, 7, 3, 6, 6, 8, 5, 5, 4, 5, 5, 3, 5, 4, 3, 4, 4,
      3, 5, 4, 5, 5, 5, 5, 5, 4, 5, 5, 5, 4, 4, 4, 3, 5, 7, 5, 8, 8,
    ],
  },
  mainSmall: {
    offset: 24,
    width: 8,
    height: 6,
    kerning: [
      3, 2, 1, 8, 4, 8, 8, 2, 3, 3, 4, 3, 3, 3, 2, 3, 4, 3, 4, 4, 4, 4, 4, 4, 4, 4, 3, 2, 3, 3, 3, 4, 8, 4, 4, 4, 4, 4,
      4, 4, 4, 3, 4, 4, 4, 5, 4, 4, 4, 4, 4, 4, 3, 4, 4, 5, 4, 4, 4, 3, 8, 3, 8, 8, 8, 4, 4, 4, 4, 4, 4, 4, 4, 3, 4, 4,
      4, 5, 4, 4, 4, 4, 4, 4, 3, 4, 4, 5, 4, 4, 4, 3, 8, 7, 8, 8, 8,
    ],
  },
  serif: {
    offset: 42,
    width: 16,
    height: 11,
    kerning: [
      6, 2, 1, 5, 5, 5, 5, 1, 3, 4, 5, 5, 2, 5, 1, 4, 6, 4, 6, 6, 6, 6, 6, 6, 6, 6, 2, 2, 5, 5, 5, 5, 16, 8, 6, 7, 7, 6,
      6, 8, 8, 4, 7, 9, 7, 10, 8, 8, 6, 9, 7, 5, 6, 8, 8, 12, 8, 8, 6, 3, 7, 3, 6, 6, 16, 5, 5, 4, 5, 4, 5, 5, 6, 3, 4,
      6, 3, 9, 6, 4, 5, 5, 4, 5, 4, 6, 6, 9, 6, 6, 4, 7, 3, 5, 14, 11, 16,
    ],
  },
  serifLarge: {
    offset: 75,
    width: 16,
    height: 17,
    kerning: [
      8, 5, 3, 16, 11, 15, 16, 5, 6, 6, 16, 16, 4, 5, 3, 15, 14, 9, 12, 13, 14, 12, 13, 12, 12, 13, 4, 4, 16, 16, 16,
      12, 13, 16, 15, 14, 16, 14, 14, 16, 15, 9, 12, 16, 14, 16, 16, 16, 13, 16, 16, 13, 13, 16, 16, 16, 16, 14, 14, 16,
      14, 16, 16, 16, 16, 13, 13, 11, 14, 12, 10, 12, 15, 7, 9, 15, 7, 16, 15, 11, 14, 13, 11, 10, 8, 15, 15, 16, 14,
      16, 12, 16, 16, 16, 16, 16, 16,
    ],
  },
  serifTall: {
    offset: 126,
    width: 16,
    height: 17,
    kerning: [
      6, 2, 1, 5, 5, 3, 5, 2, 16, 16, 16, 4, 16, 16, 14, 16, 10, 10, 9, 10, 9, 8, 10, 9, 8, 9, 2, 2, 5, 5, 5, 5, 16, 9,
      8, 7, 8, 7, 7, 7, 9, 4, 8, 9, 7, 13, 9, 7, 9, 7, 9, 7, 8, 9, 9, 13, 9, 10, 8, 16, 16, 16, 16, 16, 16, 8, 8, 6, 8,
      6, 7, 7, 9, 4, 3, 8, 4, 14, 9, 7, 8, 8, 8, 7, 7, 9, 9, 13, 9, 9, 9, 3, 3, 3, 16, 16, 16,
    ],
  },
  serifBold: {
    offset: 177,
    width: 16,
    height: 15,
    kerning: [
      6, 5, 1, 5, 5, 5, 5, 2, 3, 4, 5, 5, 4, 5, 4, 4, 8, 6, 10, 9, 11, 9, 9, 10, 9, 9, 2, 2, 5, 5, 5, 5, 16, 13, 11, 10,
      11, 11, 11, 12, 12, 6, 10, 12, 9, 14, 13, 11, 11, 11, 12, 9, 10, 12, 13, 16, 12, 12, 9, 3, 7, 3, 6, 6, 16, 9, 8,
      8, 8, 8, 8, 8, 9, 5, 5, 9, 5, 13, 9, 7, 8, 8, 8, 7, 6, 9, 10, 14, 9, 10, 8, 7, 3, 5, 14, 11, 16,
    ],
  },
  leaderClassic: {
    offset: 222,
    width: 16,
    height: 9,
    kerning: [
      6, 2, 1, 5, 5, 5, 5, 1, 3, 4, 5, 5, 2, 5, 1, 4, 5, 4, 5, 5, 5, 5, 5, 5, 5, 5, 2, 2, 5, 5, 5, 5, 16, 5, 5, 5, 5, 5,
      5, 5, 5, 2, 2, 5, 5, 7, 5, 5, 5, 5, 5, 5, 6, 5, 5, 7, 5, 5, 5, 3, 7, 3, 6, 16, 16, 5, 5, 5, 5, 5, 4, 5, 5, 2, 2,
      5, 2, 7, 4, 5, 5, 5, 5, 5, 4, 5, 4, 7, 5, 5, 5, 3, 5, 7, 5, 16, 16,
    ],
  },
  leaderTribal: {
    offset: 249,
    width: 16,
    height: 10,
    kerning: [
      6, 2, 1, 5, 5, 5, 5, 1, 3, 4, 5, 5, 2, 5, 2, 4, 6, 5, 5, 5, 6, 5, 5, 5, 5, 5, 2, 2, 5, 5, 5, 5, 16, 8, 7, 7, 7, 7,
      7, 8, 7, 2, 6, 8, 7, 8, 7, 8, 7, 9, 7, 8, 7, 7, 8, 12, 8, 8, 8, 3, 7, 3, 6, 6, 16, 6, 6, 6, 6, 5, 5, 6, 6, 2, 5,
      5, 3, 8, 6, 7, 6, 8, 5, 6, 5, 6, 6, 8, 6, 6, 6, 3, 5, 7, 5, 16, 16,
    ],
  },
  leaderEastern: {
    offset: 279,
    width: 16,
    height: 10,
    kerning: [
      6, 2, 1, 5, 5, 5, 5, 1, 3, 4, 5, 5, 2, 5, 1, 4, 5, 3, 6, 5, 5, 5, 5, 5, 5, 5, 2, 2, 5, 5, 5, 5, 16, 8, 8, 6, 8, 5,
      5, 7, 8, 5, 5, 10, 8, 11, 7, 7, 8, 8, 9, 5, 7, 10, 9, 10, 9, 7, 7, 3, 7, 3, 6, 6, 16, 6, 6, 4, 6, 4, 5, 6, 8, 4,
      4, 6, 4, 10, 7, 4, 6, 6, 6, 4, 5, 8, 8, 10, 7, 7, 4, 5, 4, 9, 13, 16, 16,
    ],
  },
};

export const measureText = (font: Font, text: string) => {
  let width = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    width += font.kerning[code - 32] + 1;
  }
  return width;
};
