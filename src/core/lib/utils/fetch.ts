import Https from "https";
import Http from "http";

// keep alive if chrome load balancer found
const keepAlive = !!process.env.CHROME_LB;

const agentHttp = new Http.Agent({ keepAlive });
const agentHttps = new Https.Agent({ keepAlive });

// network request to http or https parsing json
export const fetchUrl = (
  url: string,
  http?: boolean,
  ua?: boolean
): Promise<any> => {
  let getMethod = Https.get;
  let agent = agentHttps;

  // run as http
  if (http) {
    getMethod = Http.get;
    agent = agentHttp as Https.Agent;
  }

  return new Promise(async (resolve, reject) => {
    getMethod(url, { agent: ua ? agent : false }, (res) => {
      const { statusCode } = res;
      const contentType = res.headers["content-type"];

      let error;

      if (statusCode !== 200) {
        error = new Error("Request Failed.\n" + `Status Code: ${statusCode}`);
      } else if (!/^application\/json/.test(contentType)) {
        error = new Error(
          "Invalid content-type.\n" +
            `Expected application/json but received ${contentType}`
        );
      }

      if (error) {
        res.resume();
        reject(error.message);
        return;
      }

      res.setEncoding("utf8");
      let rawData = "";

      res.on("data", (chunk) => {
        rawData += chunk;
      });

      res.on("end", () => {
        let data = "";

        if (rawData) {
          try {
            data = JSON.parse(rawData);
          } catch (e) {
            console.error(e);
          }
        }
        resolve(data);
      });
    })
      .on("error", (err) => {
        reject(err);
      })
      .on("socket", (socket) => {
        socket.emit("agentRemove");
      });
  });
};
