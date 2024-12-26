import { FRONT_URL } from "./env.js";
import Grabber from "./Grabber.js";
import getWorker from "./threadsPool.js";

async function main() {
  const worker = getWorker();
  const grabber = await Grabber.create();
  const connection = await grabber.getConnection();
  const result = await worker.run({
    connection,
    url: FRONT_URL,
  });
  console.log("result: ", result);

  await grabber.destory();
  await worker.destroy();
}

main();
