import fetch from "node-fetch";
import { AI_SERVICE_URL } from "../../config";

interface ClassifyModelType {
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
    const data = await fetch(`${AI_SERVICE_URL}/api/parseImg`, {
      method: "POST",
      body: JSON.stringify({
        img: String(img),
        width: Number(config.width),
        height: Number(config.height),
      }),
      headers: { "Content-Type": "application/json" },
    });
    if (data?.status === 200) {
      return await data.json();
    }
  } catch (e) {
    console.log(e, { type: "error" });
  }
  return null;
};
