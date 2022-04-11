import { controller } from "@app/proto/website-client";

export interface ClassifyModelType {
  className: string;
  probability: number;
}

export const detectImageModel = async (
  img,
  config = {
    width: 0,
    height: 0,
  }
): Promise<ClassifyModelType> => {
  if (!img) {
    return null;
  }
  try {
    const data = (await controller.parseImg({
      img,
      width: Number(config.width),
      height: Number(config.height),
    })) as any;

    return data;
  } catch (e) {
    console.error(e);
  }
  return null;
};
