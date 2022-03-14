const untypedPalette = {
  black: [0, 0, 0],
  white: [235, 235, 235],
  grayLight: [138, 138, 142],
  grayDark: [77, 77, 77],
  cyan: [12, 227, 235],
  cyanDark: [0, 170, 170],
  green: [97, 227, 101],
  greenDark: [44, 121, 0],
  yellow: [255, 255, 150],
  yellowDark: [142, 89, 40],
  blue: [121, 142, 255],
  blueDark: [48, 77, 178],
  brown: [142, 89, 40], // roads
};

// todo: type correctly so we get a type error if providing anything other than [number, number, number] in above map
const palette = untypedPalette as { [key in keyof typeof untypedPalette]: [number, number, number] };

export { palette };
