/*
 *
 * Helper: `initNphiesScraping`.
 *
 */
import puppeteer from "puppeteer";
import { delayProcess } from "@exsys-web-server/helpers";
import submitScrapingForm from "./submitScrapingForm.mjs";
import {
  loadingPageTimeout,
  loginPageUrl,
  loginUserName,
  loginPassword,
  loginButtonSelector,
  optFieldSelector,
  nphiesViewerPageName,
} from "./constants.mjs";

const initNphiesScraping = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1200, height: 800 },
  });

  const page = await browser.newPage();
  await page.goto(loginPageUrl, { timeout: loadingPageTimeout });

  // start submitting the base login form
  await page.type("#username", loginUserName);
  await page.type("#password", loginPassword);
  await submitScrapingForm(page, loginButtonSelector);
  // end submitting the base login form

  // start submitting the otp login form
  const currentPageUrl = page.url();
  const isCurrentPageIsOptPage = currentPageUrl.includes("login-actions");
  const optField = await page.$(optFieldSelector);

  if (isCurrentPageIsOptPage && optField) {
    let optValueHasBeenSet = false;

    while (!optValueHasBeenSet) {
      const optValue = await page.$eval(
        optFieldSelector,
        (input) => input.value
      );

      if (optValue && optValue.length > 5) {
        await submitScrapingForm(page, loginButtonSelector);
        optValueHasBeenSet = true;
        break;
      } else {
        await delayProcess(1010);
      }
    }

    const nphiesHomePage = page.url(); // https://viewer.nphies.sa/LightFHIR
    const canStartDataScraping =
      optValueHasBeenSet && nphiesHomePage.includes(nphiesViewerPageName);

    const scrapingPagesBaseurl = `${nphiesHomePage}/tracking`;

    return {
      page,
      nphiesHomePage,
      canStartDataScraping,
      claimsPageUrl: `${scrapingPagesBaseurl}/claim`,
      preAuthorizationsPageUrl: `${scrapingPagesBaseurl}/preauthorization`,
    };
  }
  // end submitting the otp login form

  return {
    canStartDataScraping: false,
    reason: "the login process failed",
  };
};

export default initNphiesScraping;
