const imageAssets = ['ter257.pic.gif', 'sp257.pic.gif', 'fonts.cv.png'] as const;

export type ImageAssetKey = typeof imageAssets[number];

const imageCache: { [key: string]: HTMLImageElement } = {};

export const loadImage = async (src: string): Promise<void> => {
  const image = new Image();
  image.src = `/assets/${src}`;
  await new Promise((res, rej) => {
    image.onload = res;
    image.onerror = rej;
  });
  imageCache[src] = image;
};

export const getImageAsset = (assetKey: ImageAssetKey): HTMLImageElement => {
  return imageCache[assetKey];
};

export const loadJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  const json = (await response.json()) as T;
  return json;
};

export const loadAllAssets = async () => {
  const promises = imageAssets.map(loadImage);
  await Promise.all(promises);
  console.log('Done loading assets');
};
