import { credentials } from "@grpc/grpc-js";
import { GRPC_HOST_MAV, GRPC_HOST_CDN } from "../config/rpc";
import { Service, getProto } from "./website";

let mavClient: Service["WebsiteService"]["service"];
let cdnClient: Service["WebsiteService"]["service"];

export const killClient = () => {
  mavClient?.close();
  cdnClient?.close();
};

// mav service server client for testing
const createMavClient = async () => {
  try {
    const { Mav } = await getProto("/mav.proto");
    mavClient = new Mav(GRPC_HOST_MAV, credentials.createInsecure());
  } catch (e) {
    console.error(e);
  }
};

// cdn service server client for testing
const createCdnClient = async () => {
  try {
    const { Cdn } = await getProto("/cdn.proto");
    cdnClient = new Cdn(GRPC_HOST_CDN, credentials.createInsecure());
  } catch (e) {
    console.error(e);
  }
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
  parseImg,
  addScript,
  addScreenshot,
};

export { mavClient, cdnClient, createCdnClient, createMavClient };
