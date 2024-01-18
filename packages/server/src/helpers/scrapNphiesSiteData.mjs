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
  scrapFoldername,
  loginUserName,
  loginPassword,
  loginButtonSelector,
  optFieldSelector,
  // ignoredUrlsSubValues,
  // dashboardSideBarSelector,
  nphiesViewerPageName,
  loginPageUrl,
  dashboardSideBarClaimsSelector,
  // dashboardSideBarPreAuthorizationsSelector,
  otpPageSubmissionApiUrl,
  loadingPageTimeout,
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
  await page.goto(loginPageUrl, { timeout: loadingPageTimeout });

  // submit the base login form
  await page.type("#username", loginUserName);
  await page.type("#password", loginPassword);
  await submitScrapingForm(page, loginButtonSelector);

  const currentPageUrl = page.url();
  const isCurrentPageIsOptPage = currentPageUrl.includes("login-actions");
  const optField = await page.$(optFieldSelector);

  const isInsuredOptPage = isCurrentPageIsOptPage && optField;

  let otpApiResponse = undefined;

  if (isInsuredOptPage) {
    const apiResponse = await page.waitForResponse(
      (response) => {
        const url = response.request().url();
        return url.includes(otpPageSubmissionApiUrl);
      },
      { timeout: loadingPageTimeout }
    );

    otpApiResponse = await getPageApiResponseData(apiResponse, [
      otpPageSubmissionApiUrl,
    ]);
  }

  const {
    isValidApiUrl: isValidOptApiUrl,
    result: otpResult,
    ...optRestResults
  } = otpApiResponse;

  let shouldProcessNextPageApi = false;

  if (isValidOptApiUrl) {
    const isInvalidLogin = (otpResult || "").includes("Invalid OTP number");

    shouldProcessNextPageApi = !isInvalidLogin;

    await writeResultFile({
      folderName: `${scrapFoldername}/session-response`,
      data: {
        isValidOptApiUrl,
        isInvalidLogin,
        ...optRestResults,
        result: otpResult,
      },
    });
  }

  if (shouldProcessNextPageApi) {
    await page.waitForNavigation();
    const nphiesDashboardPage = page.url();

    console.log("nphiesDashboardPage", nphiesDashboardPage);

    // if (nphiesDashboardPage.includes(nphiesViewerPageName)) {
    //   // await delayProcess(3000);
    //   await submitScrapingForm(page, dashboardSideBarClaimsSelector, {
    //     waitUntil: "networkidle0",
    //   });

    //   page.on("response", async (response) => {
    //     console.log("RESPONSE page.url()", page.url());
    //     const { isValidApiUrl, ...results } =
    //       await getPageApiResponseData(response, ["/viewerapi/"]);

    //     if (!isValidApiUrl) {
    //       return;
    //     }

    //     await writeResultFile({
    //       folderName: `${scrapFoldername}/response`,
    //       data: {
    //         isValidApiUrl,
    //         ...results,
    //       },
    //     });
    //   });
    // }
  }

  // if (isInsuredOptPage) {
  //   page.on("response", async (response) => {
  //     const { isValidApiUrl, result, ...results } =
  //       await getPageApiResponseData(response, [otpPageSubmissionApiUrl]);

  //     if (isValidApiUrl) {
  //       const isInvalidLogin = (result || "").includes("Invalid OTP number");

  //       if (!isInvalidLogin) {
  //         await page.waitForNavigation();
  //         const nphiesDashboardPage = page.url();

  //         console.log("nphiesDashboardPage", nphiesDashboardPage);

  //         // if (nphiesDashboardPage.includes(nphiesViewerPageName)) {
  //         //   // await delayProcess(3000);
  //         //   await submitScrapingForm(page, dashboardSideBarClaimsSelector, {
  //         //     waitUntil: "networkidle0",
  //         //   });

  //         //   page.on("response", async (response) => {
  //         //     console.log("RESPONSE page.url()", page.url());
  //         //     const { isValidApiUrl, ...results } =
  //         //       await getPageApiResponseData(response, ["/viewerapi/"]);

  //         //     if (!isValidApiUrl) {
  //         //       return;
  //         //     }

  //         //     await writeResultFile({
  //         //       folderName: `${scrapFoldername}/response`,
  //         //       data: {
  //         //         isValidApiUrl,
  //         //         ...results,
  //         //       },
  //         //     });
  //         //   });
  //         // }
  //       }

  //       await writeResultFile({
  //         folderName: `${scrapFoldername}/session-response`,
  //         data: {
  //           isInvalidLogin,
  //           ...results,
  //           result,
  //         },
  //       });
  //     }
  //   });
  //   // page.off("response", handler);
  // }
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
