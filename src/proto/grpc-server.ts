import { Server, ServerCredentials } from "@grpc/grpc-js";
import { GRPC_HOST, GRPC_PORT } from "../config/rpc";
import { crawlWebsite } from "../core/controllers/crawl";
import { mutateScript } from "../core/controllers/mutate";
import { getProto } from "./website";

let server: Server;

export const createServer = async () => {
  const websiteProto = await getProto();
  const healthProto = await getProto("health.proto");

  server = new Server();

  server.addService(healthProto.health.HealthCheck.service, {
    check: (_call, callback) => {
      callback(null, { healthy: true });
    },
  });

  server.addService(websiteProto.Pagemind.service, {
    // get page report
    scan: async (call, callback) => {
      const page = await crawlWebsite(call.request);
      callback(null, page);
    },
    // set scripts for the page
    setScript: async (call, callback) => {
      const page = await mutateScript(call.request);
      callback(null, page);
    },
  });

  server.bindAsync(GRPC_HOST, ServerCredentials.createInsecure(), () => {
    server.start();
    console.log(`gRPC server running at http://127.0.0.1:${GRPC_PORT}`);
  });
};

export const killServer = async () => {
  const websiteProto = await getProto();
  const healthProto = await getProto("health.proto");

  server.removeService(websiteProto.Pagemind.service);
  server.removeService(healthProto.health.HealthCheck.service);
  server.forceShutdown();
};
