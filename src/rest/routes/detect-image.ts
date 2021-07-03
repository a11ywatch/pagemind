import { detectImageModel } from "../../core/ai";

const detectImage = async (req, res, next) => {
  try {
    const data = await detectImageModel({
      img: req.body.img,
    });

    res.json(data);
  } catch (e) {
    console.log(e, { type: "error" });
    next();
  }
};

export { detectImage };
