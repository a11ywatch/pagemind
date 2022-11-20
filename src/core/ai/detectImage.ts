import { controller } from "../../proto/website-client";

export interface ClassifyModelType {
  className: string;
  probability: number;
}

// fire gRPC request to MAV
export const detectImageModel = async (
  img,
  config = {
    width: 0,
    height: 0,
  },
  url = "",
  cv = true
): Promise<ClassifyModelType> =>
  await controller.parseImg({
    img,
    width: config.width,
    height: config.height,
    url,
    cv,
  });
