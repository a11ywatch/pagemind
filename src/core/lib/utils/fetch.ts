import { get } from "https";

// fetch wrapper using http
export const fetchUrl = (url: string): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    get(url, (res) => {
      res.setEncoding("utf8");
      let rawData = "";

      res.on("data", (chunk) => {
        rawData += chunk;
      });

      res.on("end", () => {
        let data;
        try {
          data = JSON.parse(rawData);
        } catch (e) {
          console.error(e);
        }
        resolve(data);
      });
    }).on("error", (err) => {
      reject(`${err.message}.`);
    });
  });
};
