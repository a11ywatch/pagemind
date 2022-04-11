import { credentials } from "@grpc/grpc-js";
import { GRPC_HOST, GRPC_HOST_MAV, GRPC_HOST_CDN } from "../config/rpc";
import { Service, getProto } from "./website";

let client: Service["WebsiteService"]["service"];
let mavClient: Service["WebsiteService"]["service"];
let cdnClient: Service["WebsiteService"]["service"];

export const killClient = () => {
  client?.close();
  mavClient?.close();
  cdnClient?.close();
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

// cdn service server client for testing
const createCdnClient = async () => {
  try {
    const { WebsiteService } = await getProto("cdn.proto");
    cdnClient = new WebsiteService(GRPC_HOST_CDN, credentials.createInsecure());
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

const addScreenshot = (website = {}) => {
  return new Promise((resolve, reject) => {
    cdnClient.addScreenshot(website, (error, res) => {
      if (!error) {
        resolve(res);
      } else {
        reject(error);
      }
    });
  });
};

const addScript = (website = {}) => {
  return new Promise((resolve, reject) => {
    cdnClient.addScript(website, (error, res) => {
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
  addScript,
  addScreenshot,
};

export { client, mavClient, createCdnClient, createClient, createMavClient };
