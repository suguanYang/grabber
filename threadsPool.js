import path from "node:path";
import { cpus } from "node:os";

import { Piscina } from "piscina";

function getWorker() {
  return new Piscina({
    filename: path.join(import.meta.dirname, "./worker.js"),
    maxThreads: cpus().length,
    env: {
      NODE_ENV: "production",
      ...process.env,
    },
  });
}

export default getWorker;
