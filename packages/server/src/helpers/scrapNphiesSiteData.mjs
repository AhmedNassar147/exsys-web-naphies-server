/*
 *
 * Helper: `scrapeNphiesSiteData`.
 *
 */
import puppeteer from "puppeteer";
import {
  writeResultFile,
  createUUID,
  delayProcess,
} from "@exsys-web-server/helpers";

const ignoredUrlsSubValues = [
  ".svg",
  ".css",
  ".png",
  ".jpg",
  ".woff",
  ".woff2",
  "login-actions/authenticate",
  "recaptcha",
];

const loginButtonSelector = "input[name='login']";
const optFieldSelector = "input[name='otp-number']";
const dashboardSideBarSelector = "ul[class='assista-aside-list']";
const dashboardSideBarClaimsSelector = `${dashboardSideBarSelector} > li:nth-child(4)`;
const dashboardSideBarPreAuthorizationsSelector = `${dashboardSideBarSelector} > li:nth-child(3)`;

const nphiesViewerPageName = "tracking/dashboard";
const scrapFoldername = "nphiesDashboardScraping";

const loginPageUrl =
  "https://sso.nphies.sa/auth/realms/sehaticoreprod/protocol/openid-connect/auth?client_id=tv-ui&redirect_uri=https%3A%2F%2Fviewer.nphies.sa%2FLightFHIR&state=2f70125f-1c82-41af-b7d0-62461ef7b07b&response_mode=fragment&response_type=code&scope=openid&nonce=28f2911e-f02d-4903-85f2-41d4627c2506";

// const loginUserName = "nlubad@sagaf-eye.com";
// const loginPassword = "ALsaggaf@20121";

const loginUserName = "Halsaggaf@sagaf-eye.com";
const loginPassword = "Hussien123";

const submitForm = async (page, submissionSelector) =>
  await Promise.all([
    page.waitForNavigation(), // The promise resolves after navigation has finished
    page.evaluate(
      (selector) => document.querySelector(selector).click(), // click the submission button
      submissionSelector
    ),
  ]);

const scrapeNphiesSiteData = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1200, height: 800 },
  });

  const page = await browser.newPage();
  await page.goto(loginPageUrl, { timeout: 100000 });

  // submit the base login form
  await page.type("#username", loginUserName);
  await page.type("#password", loginPassword);
  await submitForm(page, loginButtonSelector);

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
        await submitForm(page, loginButtonSelector);
        optValueHasBeenSet = true;
        break;
      } else {
        await delayProcess(1010);
      }
    }

    await page.waitForNavigation(); // The promise resolves after navigation has finished
    const nphiesDashboardPage = page.url(); // https://viewer.nphies.sa/LightFHIR

    if (nphiesDashboardPage.includes(nphiesViewerPageName)) {
      await submitForm(page, dashboardSideBarClaimsSelector);
      await page.setRequestInterception(true);

      //  https://sgw.nphies.sa/viewerapi/claim?size=10&page=0&date_from=2024-01-16T21:00:00.240Z&date_to=2024-01-17T09:53:58.240Z
      // https://sgw.nphies.sa/viewerapi/claim?size=10&page=0&date_from=2024-01-11T09:53:11.602Z&date_to=2024-01-17T09:53:11.602Z

      console.log("page.url after navigation", page.url());

      page.on("request", async (interceptedRequest) => {
        if (interceptedRequest.isInterceptResolutionHandled()) {
          return;
        }

        interceptedRequest.continue();

        const url = interceptedRequest.url();
        const isNavigationRequest = interceptedRequest.isNavigationRequest();

        const shouldIgnoreUrl =
          isNavigationRequest ||
          ignoredUrlsSubValues.some((value) => url.includes(value));

        if (shouldIgnoreUrl) {
          return;
        }

        await writeResultFile({
          folderName: `${scrapFoldername}/claims/${createUUID()}`,
          data: {
            isNavigationRequest,
            requestUrl: url,
            requestHeaders: interceptedRequest.headers(),
            requestResponse: interceptedRequest.response(),
            interceptedRequest,
          },
        });
      });
    }
  }
};

export default scrapeNphiesSiteData;

(async () => {
  const [startpuppteer] = process.argv || [];

  if (startpuppteer) {
    await scrapeNphiesSiteData();
  }
})();
