import { Server, ServerCredentials } from "@grpc/grpc-js";
import { GRPC_HOST, GRPC_PORT } from "@app/config/rpc";
import { crawlWebsite } from "@app/core/controllers/update/crawl";
import { getProto } from "./website";

// test data todo remove
const pages = [
  { id: "1", title: "Website 1", content: "Content 1" },
  { id: "2", title: "Website 2", content: "Content 2" },
];

let server: Server;

export const createServer = async () => {
  const websiteProto = await getProto();
  server = new Server();

  server.addService(websiteProto.WebsiteService.service, {
    // @testing
    list: (_, callback) => {
      callback(null, { websites: pages });
    },
    // @testing
    gather: (call, callback) => {
      let page = call.request;
      callback(null, page);
    },
    // crawl page via puppeteer for issues
    scan: async (call, callback) => {
      const page = await crawlWebsite(call.request);
      callback(null, page);
    },
  });

  server.bindAsync(GRPC_HOST, ServerCredentials.createInsecure(), () => {
    server.start();
    console.log(`Server running at http://127.0.0.1:${GRPC_PORT}`);
  });
};

export const killServer = async () => {
  const websiteProto = await getProto();
  server.removeService(websiteProto.WebsiteService.service);
  server.forceShutdown();
};
