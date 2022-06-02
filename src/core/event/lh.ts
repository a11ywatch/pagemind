import { EventEmitter } from "events";

// lh emiter for data
class LighthouseEmitter extends EventEmitter {}

export const lighthouseEmitter = new LighthouseEmitter();
