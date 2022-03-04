export const loadImage = async (src: string): Promise<HTMLImageElement> => {
  const image = new Image();
  image.src = src;
  return new Promise((res, rej) => {
    image.onload = () => res(image);
    image.onerror = rej;
  });
};

export const loadJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  const json = (await response.json()) as T;
  return json;
};
