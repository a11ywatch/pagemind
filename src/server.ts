import type { AddressInfo } from "net";
import http from "http";
import { startGRPC } from "./proto/init";
import { getWsEndPoint } from "./config/chrome";

// TODO: REMOVE for central GRPC HC server
const server = http.createServer(function (req, res) {
  if (
    req.url === "/_internal_/healthcheck" ||
    req.url === "/_internal_/healthcheck/"
  ) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.write(`{ status: "healthy" }`); // status -> healthy, degraded, offline
    res.end();
  }
});

const coreServer = server.listen(process.env.PORT || 0, async () => {
  console.log(
    `🚀 Server ready at 127.0.0.1:${(coreServer.address() as AddressInfo).port}`
  );
  await getWsEndPoint(true);

  await startGRPC();
});

export default coreServer;
