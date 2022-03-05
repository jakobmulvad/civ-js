export const assets = {};

export const loadImage = async (src: string): Promise<void> => {
  const image = new Image();
  image.src = src;
  await new Promise((res, rej) => {
    image.onload = res;
    image.onerror = rej;
  });
  assets[src] = image;
};

export const loadJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  const json = (await response.json()) as T;
  return json;
};

export const loadAllAssets = async () => {
  await loadImage("/assets/ter257.pic.gif");
  await loadImage("/assets/sp257.pic.gif");
  console.log("Done loading assets");
};
