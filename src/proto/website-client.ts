import { credentials } from "@grpc/grpc-js";
import { GRPC_HOST_CORE, GRPC_HOST_MAV, GRPC_HOST_CDN } from "../config/rpc";
import { Service, getProto } from "./website";

let mavClient: Service["Mav"]["service"];
let cdnClient: Service["Cdn"]["service"];
let websiteClient: Service["website"]["WebsiteService"]["service"];

export const killClient = () => {
  mavClient?.close();
  cdnClient?.close();
};

// core service server client
const createWebsiteClient = async () => {
  const { website } = await getProto("website.proto");
  websiteClient = new website.WebsiteService(
    GRPC_HOST_CORE,
    credentials.createInsecure()
  );
};

// mav service server client for testing
const createMavClient = async () => {
  const { Mav } = await getProto("mav.proto");
  mavClient = new Mav(GRPC_HOST_MAV, credentials.createInsecure());
};

// cdn service server client for testing
const createCdnClient = async () => {
  const { Cdn } = await getProto("cdn.proto");
  cdnClient = new Cdn(GRPC_HOST_CDN, credentials.createInsecure());
};

const parseImg = (
  website = {}
): Promise<{
  className: string;
  probability: number;
}> => {
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

// store lighthouse results
const addLighthouse = (website = {}) => {
  return new Promise((resolve, reject) => {
    websiteClient.pageSet(website, (error, res) => {
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
  addLighthouse,
};

export {
  mavClient,
  cdnClient,
  websiteClient,
  createCdnClient,
  createMavClient,
  createWebsiteClient,
};
