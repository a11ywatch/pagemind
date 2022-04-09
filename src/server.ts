import type { AddressInfo } from "net";
import express from "express";
import bodyParser from "body-parser";
import { crawl, detectImage, setScripts } from "./rest/routes";
import { startGRPC } from "./proto/init";

const app = express();

app.use(bodyParser.json({ limit: "500mb", extended: true }));

app.post("/api/getPageIssues", crawl);
app.post("/api/detectImage", detectImage);
app.post("/api/updateScript", setScripts);

app.get("/_internal_/healthcheck", (_, res) => {
  res.send({
    status: "healthy",
  });
});

const coreServer = app.listen(process.env.PORT || 0, async () => {
  console.log(
    `🚀 Server ready at 127.0.0.1:${(coreServer.address() as AddressInfo).port}`
  );
  await startGRPC();
});

export default coreServer;
