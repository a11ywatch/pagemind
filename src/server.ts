import type { AddressInfo } from "net";
import express from "express";
import { startGRPC } from "./proto/init";

const app = express();

// TODO: move to http
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
