/*
 *
 * Helper: `scrapeNphiesSiteData`.
 *
 */
import puppeteer from "puppeteer";
import {
  writeResultFile,
  // createUUID,
  // delayProcess,
} from "@exsys-web-server/helpers";
import axios from "axios";
import getPageApiResponseData from "./nphies-scraping/getPageApiResponseData.mjs";
import submitScrapingForm from "./nphies-scraping/submitScrapingForm.mjs";
import {
  // ignoredUrlsSubValues,
  loginButtonSelector,
  optFieldSelector,
  // dashboardSideBarSelector,
  nphiesViewerPageName,
  loginPageUrl,
  dashboardSideBarClaimsSelector,
  // dashboardSideBarPreAuthorizationsSelector,
  scrapFoldername,
  loginUserName,
  loginPassword,
} from "./nphies-scraping/constants.mjs";

// const params = {
//   dateFrom: "",
//   dateTo: "",
//   bundleId: "",
//   transactionIdentifier: "",
//   patientIdentifier: "",
// };

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
  await submitScrapingForm(page, loginButtonSelector);

  const currentPageUrl = page.url();
  const isCurrentPageIsOptPage = currentPageUrl.includes("login-actions");
  const optField = await page.$(optFieldSelector);

  const isInsuredOptPage = isCurrentPageIsOptPage && optField;

  let optValueHasBeenSet = false;

  if (isInsuredOptPage) {
    const handler = async (response) => {
      const { isValidApiUrl, result, ...results } =
        await getPageApiResponseData(response, [otpPageSubmissionApiUrl]);

      if (isValidApiUrl) {
        const isInvalidLogin = (result || "").includes("Invalid OTP number");

        optValueHasBeenSet = !isInvalidLogin;

        await writeResultFile({
          folderName: `${scrapFoldername}/session-response`,
          data: {
            isInvalidLogin,
            ...results,
            result,
          },
        });
      }
    };

    page.on("response", handler);
    // page.off("response", handler);
  }

  console.log("here", {
    optValueHasBeenSet,
    page: page.url(),
  });

  return;

  if (!isInsuredOptPage) {
    await page.waitForNavigation();
  }

  const nphiesDashboardPage = page.url();

  if (nphiesDashboardPage.includes(nphiesViewerPageName)) {
    // await delayProcess(3000);
    await submitScrapingForm(page, dashboardSideBarClaimsSelector, {
      waitUntil: "networkidle0",
    });

    page.on("response", async (response) => {
      console.log("RESPONSE page.url()", page.url());
      const { isValidApiUrl, ...results } = await getPageApiResponseData(
        response,
        ["/viewerapi/"]
      );

      if (!isValidApiUrl) {
        return;
      }

      await writeResultFile({
        folderName: `${scrapFoldername}/response`,
        data: {
          isValidApiUrl,
          ...results,
        },
      });
    });
  }
};

export default scrapeNphiesSiteData;

(async () => {
  const [startpuppteer] = process.argv || [];

  if (startpuppteer) {
    await scrapeNphiesSiteData();
  }
})();

// console.log("page.url after navigation", page.url());

// let optValueHasBeenSet = false;

// while (!optValueHasBeenSet) {
//   const optValue = await page.$eval(optFieldSelector, (input) => input.value);

//   if (optValue && optValue.length > 5) {
//     await submitForm(page, loginButtonSelector);
//     optValueHasBeenSet = true;
//     break;
//   } else {
//     await delayProcess(1000);
//   }
// }

// page.on("request", async (interceptedRequest) => {
//   if (interceptedRequest.isInterceptResolutionHandled()) {
//     return;
//   }

//   interceptedRequest.continue();

//   const url = interceptedRequest.url();
//   const isNavigationRequest = interceptedRequest.isNavigationRequest();

//   const shouldIgnoreUrl =
//     isNavigationRequest ||
//     ignoredUrlsSubValues.some((value) => url.includes(value));

//   if (shouldIgnoreUrl) {
//     return;
//   }

//   await writeResultFile({
//     folderName: `${scrapFoldername}/claims/${createUUID()}`,
//     data: {
//       isNavigationRequest,
//       requestUrl: url,
//       requestHeaders: interceptedRequest.headers(),
//       requestResponse: interceptedRequest.response(),
//       interceptedRequest,
//     },
//   });
// });

// Host: sgw.nphies.sa
// Origin: https://viewer.nphies.sa
// Referer: https://viewer.nphies.sa/
// Sec-Fetch-Dest: empty
// Sec-Fetch-Mode: cors
// Sec-Fetch-Site: same-site
// sec-ch-ua: "Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"
// sec-ch-ua-mobile: ?0
// sec-ch-ua-platform: "Windows"
