import { crawlWebsite } from "../../core/controllers";

const crawl = async (req, res, next) => {
  try {
    const data = await crawlWebsite({
      url: decodeURIComponent(req.body.url + ""),
      userId: req.body.userId,
      pageHeaders: req.body.pageHeaders,
    });

    res.json(data);
  } catch (e) {
    console.log(e);
    next();
  }
};

export { crawl };
