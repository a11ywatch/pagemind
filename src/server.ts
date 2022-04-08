import type { AddressInfo } from "net";
import express from "express";
import bodyParser from "body-parser";
import { DEV } from "./config";
import { root, crawl, detectImage, setScripts } from "./rest/routes";

const app = express();

app.use(bodyParser.json({ limit: "500mb", extended: true }));

app.get("/", root);
app.post("/api/getPageIssues", crawl);
app.post("/api/detectImage", detectImage);
app.post("/api/updateScript", setScripts);

const coreServer = app.listen(process.env.PORT || 0, () => {
  console.log(
    `🚀 Server ready at ${DEV ? "localhost" : ""}:${
      (coreServer.address() as AddressInfo).port
    }`
  );
});

export default coreServer;
