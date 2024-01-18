/*
 *
 * Helper: `waitForPageResponse`.
 *
 */
import getPageApiResponseData from "./getPageApiResponseData.mjs";
import { loadingPageTimeout } from "./constants.mjs";

const waitForPageResponse = async (page, monitoredApi) => {
  const apiResponse = await page.waitForResponse(
    (response) => response.request().url().includes(monitoredApi),
    { timeout: loadingPageTimeout }
  );

  return await getPageApiResponseData(apiResponse, [monitoredApi]);
};

export default waitForPageResponse;
