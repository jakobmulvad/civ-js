// Source (with slight optimizations on my end): https://stackoverflow.com/questions/294297/javascript-implementation-of-gzip

// I tried using "real" compression algorithms like gzip and deflate and got an additional 50% reduction in size
// but I don't feel like the tradeoff of a vastly more complex algorithm is worth it.
// LZW gives us around 97% reduction in size of the stringified game state which is fine (~500k -> ~16k)

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
