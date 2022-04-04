import { Rect } from './helpers';

const imageAssets = ['ter257.pic.gif', 'sp257.pic.png', 'sp299.pic.png', 'fonts.cv.png'] as const;

export type ImageAssetKey = typeof imageAssets[number];

export type Sprite = {
  asset: ImageAssetKey;
} & Rect;

const imageCache: { [key: string]: CanvasRenderingContext2D } = {};

export const loadImage = async (src: string): Promise<void> => {
  const image = new Image();
  image.src = `/assets/${src}`;
  await new Promise((res, rej) => {
    image.onload = res;
    image.onerror = rej;
  });

  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Could not create context for asset ' + src);
  }

  context.drawImage(image, 0, 0);

  imageCache[src] = context;
};

export const getImageAsset = (assetKey: ImageAssetKey): CanvasRenderingContext2D => {
  return imageCache[assetKey];
};

export const loadJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  const json = (await response.json()) as T;
  return json;
};

const loadAllAssets = async () => {
  const promises = imageAssets.map(loadImage);
  await Promise.all(promises);
  console.log('Done loading assets');
};

const assetsPromise = loadAllAssets();

export const waitForAssets = () => assetsPromise;
