import debug from "./debug.js";

export default class PagePool {
  workingQ = [];
  maxPages = 0;
  pages = [];
  browser = null;

  constructor(browser, options) {
    this.browser = browser;
    this.maxPages = options.maxPages;
    this.pages = [];
  }

  async use(task) {
    let onResolve;
    const pendingSignal = new Promise((res) => (onResolve = res));
    let ret;
    let error = null;

    this.workingQ.push((page) =>
      task(page.instance)
        .then(
          (res) => (ret = res),
          (err) => (error = err)
        )
        .catch((err) => (error = err))
        .finally(() => {
          onResolve(null);
        })
    );

    this.runNext();

    await pendingSignal;

    if (error !== null) {
      return Promise.reject(error);
    }

    return ret;
  }

  async getPage() {
    const readyPage = this.pages.find((page) => page.status === "ready");
    if (readyPage) {
      return readyPage;
    }

    const page = {
      instance: await this.browser.newPage(),
      status: "ready",
    };
    this.pages.push(page);

    this.#disableActivities(page.instance);

    return page;
  }

  async runNext() {
    if (
      this.pages.filter((w) => w.status === "runing").length < this.maxPages &&
      this.workingQ.length > 0
    ) {
      const page = await this.getPage();
      page.status = "runing";
      const nextRun = this.workingQ.shift();
      nextRun(page).finally(() => {
        page.status = "ready";
        this.runNext();
      });
      debug("WorkerPool runing: ", this.workingQ.length, this.pages.length);
    }
  }

  #disableActivities(page) {
    page.setRequestInterception(true);

    page.on("request", (request) => {
      if (request.url().endsWith("serviceworker.html")) {
        request.abort();
      } else if (request.url().includes("websocket")) {
        request.abort();
      } else {
        request.continue();
      }
    });

    return page;
  }
}
