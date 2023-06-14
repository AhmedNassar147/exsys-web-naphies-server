/*
 *
 * Helper: `createNphiesRequest`.
 *
 */
import createFetchRequest from "./createFetchRequest.mjs";
import createNphiesOptions from "./createNphiesOptions.mjs";
import { NPHIES_API_URLS, PACKAGE_JSON_APP_CONFIG } from "../constants.mjs";

const { NPHIES_PRODUCTION, NPHIES_DEVELOPMENT } = NPHIES_API_URLS;
const { retryTimes: _retryTimes, retryDelay: _retryDelay } =
  PACKAGE_JSON_APP_CONFIG;

const createNphiesRequest = async ({
  isProduction,
  bodyData,
  transformApiResults,
  retryTimes = _retryTimes,
  retryDelay = _retryDelay,
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
