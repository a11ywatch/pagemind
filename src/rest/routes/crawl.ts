import { crawlWebsite } from "../../core/controllers";

const crawl = async (req, res, next) => {
  try {
    const data = await crawlWebsite(req.body);

    res.json(data);
  } catch (e) {
    console.log(e);
    next();
  }
};

export { crawl };
