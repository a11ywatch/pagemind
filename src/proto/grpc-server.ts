import { Server, ServerCredentials } from "@grpc/grpc-js";
import { GRPC_HOST, GRPC_PORT } from "@app/config/rpc";
import { crawlWebsite } from "@app/core/controllers/update/crawl";
import { mutateScript } from "@app/core/controllers/mutate";
import { getProto } from "./website";

let server: Server;

export const createServer = async () => {
  const websiteProto = await getProto();
  server = new Server();

  server.addService(websiteProto.WebsiteService.service, {
    // crawl page via puppeteer for issues
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
  server.removeService(websiteProto.WebsiteService.service);
  server.forceShutdown();
};
