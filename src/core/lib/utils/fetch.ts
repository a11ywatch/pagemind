import { get } from "https";
import { get as getHttp } from "http";

// fetch wrapper using http
export const fetchUrl = (url: string, http?: boolean): Promise<any> => {
  const getMethod = http ? getHttp : get;

  return new Promise(async (resolve, reject) => {
    getMethod(url, (res) => {
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
