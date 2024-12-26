import os from "os";
import puppeteer from "puppeteer";

import PagePool from "./PagePool.js";
import { FRONT_URL, USERNAME, PASSWORD } from "./env.js";

export default class Grabber {
  browser;
  sessionPage;

  constructor(browser) {
    this.pagePool = new PagePool(browser, { maxPages: os.cpus().length });
    this.browser = browser;
  }

  async getConnection() {
    return {
      wsEndpoint: this.browser.wsEndpoint(),
      cookies: await this.browser.cookies(),
    };
  }

  async goToPage(url, next) {
    return this.pagePool.use(async (page) => {
      page.setDefaultTimeout(300000);

      await page.goto(url);

      await page.waitForSelector(".page__wrapper");

      return next(page);
    });
  }

  async destory() {
    return this.browser.close();
  }

  async #login(page) {
    page.setDefaultTimeout(10000);
    await page.goto(`${FRONT_URL}/login`);

    await page.waitForSelector("#login button");

    await page.type("#login_loginName", USERNAME);
    await page.type("#login_password", PASSWORD);
    await page.click("#login button");

    await page.waitForNavigation();

    await page.waitForSelector("#mainApp");

    console.log("login success!!!");

    this.sessionPage = page;
  }

  static async connect(connection) {
    const browser = await puppeteer.connect({
      browserWSEndpoint: connection.wsEndpoint,
      defaultViewport: { width: 1920, height: 1080 },
    });

    await browser.setCookie(...connection.cookies);

    return new Grabber(browser);
  }

  static async create() {
    const browser = await puppeteer.launch({
      headless: true,
      debuggingPort: 9222,
      defaultViewport: { width: 1920, height: 1080 },
    });

    const grabber = new Grabber(browser);
    await grabber.pagePool.use(grabber.#login.bind(grabber));

    return grabber;
  }
}
