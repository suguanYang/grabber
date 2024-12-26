import Grabber from "./Grabber.js";

async function run(options) {
  const { url, connection } = options;
  const browser = await Grabber.connect(connection);

  const state = await browser.goToPage(url, (page) => {
    return page.evaluate(() => window.document.body.innerHTML);
  });

  return state;
}

export default run;
