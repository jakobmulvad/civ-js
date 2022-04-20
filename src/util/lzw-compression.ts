// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// Source: https://stackoverflow.com/questions/294297/javascript-implementation-of-gzip
// LZW-compress a string
export const lzwEncode = (str: string): string => {
  const dict: Record<string, number | undefined> = {};
  let currChar;
  let phrase = str.charAt(0);
  let code = 256;
  let out = '';
  let nextPhrase = '';

  for (let i = 1; i < str.length; i++) {
    currChar = str.charAt(i);
    nextPhrase = phrase + currChar;
    if (dict[nextPhrase]) {
      phrase = nextPhrase;
    } else {
      out += String.fromCharCode(phrase.length > 1 ? (dict[phrase] as number) : phrase.charCodeAt(0));
      dict[nextPhrase] = code;
      code++;
      phrase = currChar;
    }
  }
  out += String.fromCharCode(phrase.length > 1 ? (dict[phrase] as number) : phrase.charCodeAt(0));
  return out;
};

// Decompress an LZW-encoded string
export const lzwDecode = (str: string): string => {
  const dict: Record<number, string> = {};
  let currChar = str.charAt(0);
  let oldPhrase = currChar;
  let out = currChar;
  let code = 256;
  let phrase;
  for (let i = 1; i < str.length; i++) {
    const currCode = str.charCodeAt(i);
    if (currCode < 256) {
      phrase = str.charAt(i);
    } else {
      phrase = dict[currCode] ? dict[currCode] : oldPhrase + currChar;
    }
    out += phrase;
    currChar = phrase.charAt(0);
    dict[code] = oldPhrase + currChar;
    code++;
    oldPhrase = phrase;
  }
  return out;
};
