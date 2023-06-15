/*
 *
 * Helper: `createNphiesRequest`.
 *
 */
import createFetchRequest from "./createFetchRequest.mjs";
import createNphiesOptions from "./createNphiesOptions.mjs";
import { NPHIES_API_URLS, RETRY_TIMES, RETRY_DELAY } from "../constants.mjs";

const { NPHIES_PRODUCTION, NPHIES_DEVELOPMENT } = NPHIES_API_URLS;

const createNphiesRequest = async ({
  isProduction,
  bodyData,
  transformApiResults,
  retryTimes = RETRY_TIMES,
  retryDelay = RETRY_DELAY,
}) => {
  const apiUrl = isProduction ? NPHIES_PRODUCTION : NPHIES_DEVELOPMENT;
  const { httpsAgent, headers } = await createNphiesOptions({
    ignoreCert: !isProduction,
  });

  return await createFetchRequest({
    baseAPiUrl: apiUrl,
    requestHeaders: headers,
    httpsAgent,
    transformApiResults,
    body: bodyData,
    retryTimes,
    retryDelay,
  });
};

export default createNphiesRequest;
