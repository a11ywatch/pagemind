import { credentials } from "@grpc/grpc-js";
import { GRPC_HOST, GRPC_HOST_MAV } from "../config/rpc";
import { Service, getProto } from "./website";

let client: Service["WebsiteService"]["service"];
let mavClient: Service["WebsiteService"]["service"];

export const killClient = () => {
  client?.close();
};

// central server client for testing
const createClient = async () => {
  try {
    const { WebsiteService } = await getProto();
    client = new WebsiteService(GRPC_HOST, credentials.createInsecure());
  } catch (e) {
    console.error(e);
  }
};

// mav service server client for testing
const createMavClient = async () => {
  try {
    const { WebsiteService } = await getProto("mav.proto");
    mavClient = new WebsiteService(GRPC_HOST_MAV, credentials.createInsecure());
  } catch (e) {
    console.error(e);
  }
};

const listWebsites = () => {
  return new Promise((resolve, reject) => {
    client.list({}, (error, res) => {
      if (!error) {
        resolve(res);
      } else {
        reject(error);
      }
    });
  });
};

const gather = (website = {}) => {
  return new Promise((resolve, reject) => {
    client.gather(website, (error, res) => {
      if (!error) {
        resolve(res);
      } else {
        reject(error);
      }
    });
  });
};

const parseImg = (website = {}) => {
  return new Promise((resolve, reject) => {
    mavClient.parseImg(website, (error, res) => {
      if (!error) {
        resolve(res);
      } else {
        reject(error);
      }
    });
  });
};

export const controller = {
  listWebsites,
  gather,
  parseImg,
};

export { client, mavClient, createClient, createMavClient };
