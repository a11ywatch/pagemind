import { adjustScript, editScript } from "./update";

export const mutateScript = async (body) => {
  const { editScript: edit, url, userId, script, newScript } = body ?? {};

  try {
    return await (edit ? editScript : adjustScript)(
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
  } catch (e) {
    console.error(e);
  }
};
