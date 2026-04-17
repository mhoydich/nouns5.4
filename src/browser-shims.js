import { Buffer } from "buffer";

globalThis.Buffer ??= Buffer;
globalThis.global ??= globalThis;

if (!globalThis.process) {
  globalThis.process = {
    env: {
      NODE_ENV: "production",
    },
  };
} else {
  globalThis.process.env ??= {};
  globalThis.process.env.NODE_ENV ??= "production";
}
