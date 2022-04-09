import { adjustScript, editScript } from "../../core/controllers";

const setScripts = async (req, res, next) => {
  const { editScript: edit, url, userId, script, newScript } = req.body;

  try {
    const data = await (edit ? editScript : adjustScript)(
      Object.assign(
        {},
        {
          url: decodeURIComponent(url + ""),
          userId,
          script,
          newScript,
        }
      )
    );

    res.json(data);
  } catch (e) {
    console.error(e);
    next();
  }
};

export { setScripts };
