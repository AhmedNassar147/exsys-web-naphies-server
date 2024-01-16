/*
 *
 * Helper: `scrapNphiesSiteData`.
 *
 */
import puppeteer from "puppeteer";
import { writeResultFile } from "@exsys-web-server/helpers";

const nphiesPageUrl =
  "https://sso.nphies.sa/auth/realms/sehaticoreprod/protocol/openid-connect/auth?client_id=tv-ui&redirect_uri=https%3A%2F%2Fviewer.nphies.sa%2FLightFHIR&state=2f70125f-1c82-41af-b7d0-62461ef7b07b&response_mode=fragment&response_type=code&scope=openid&nonce=28f2911e-f02d-4903-85f2-41d4627c2506";

const scrapNphiesSiteData = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    // args: [
    //   "--remote-debugging-port=9222",
    //   "--remote-debugging-address=192.168.13.84",
    //   "--no-sandbox",
    // ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1024 });
  await page.setRequestInterception(true);

  page.on("request", async (interceptedRequest) => {
    if (interceptedRequest.isInterceptResolutionHandled()) {
      return;
    }

    if (interceptedRequest.isNavigationRequest()) {
      return;
    }

    interceptedRequest.continue();

    const url = interceptedRequest.url();

    await writeResultFile({
      folderName: "nphies_interceptedRequest/1.json",
      data: {
        requestUrl: url,
        requestHeaders: interceptedRequest.headers(),
        requestResponse: interceptedRequest.response(),
      },
    });
  });

  const pageData = await page.goto(nphiesPageUrl);

  const url = pageData.url();
  const text = await pageData.text();

  await writeResultFile({
    folderName: "nphies_interceptedRequest/json.json",
    data: {
      url,
      text,
    },
  });
};

export default scrapNphiesSiteData;

await scrapNphiesSiteData();
