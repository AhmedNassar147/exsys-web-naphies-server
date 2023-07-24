/*
 *
 * Helper: `createExsysRequest`.
 *
 */
import createFetchRequest from "./createFetchRequest.mjs";
import {
  EXSYS_BASE_URL,
  EXSYS_API_IDS,
  RETRY_TIMES,
  RETRY_DELAY,
} from "../constants.mjs";

const createExsysRequest = async ({
  xBaseApiUrl = EXSYS_BASE_URL,
  resourceName,
  requestParams,
  requestMethod,
  requestHeaders,
  transformApiResults,
  body,
  retryTimes = RETRY_TIMES,
  retryDelay = RETRY_DELAY,
}) => {
  const resourceNameUrl = EXSYS_API_IDS[resourceName];

  if (!resourceNameUrl) {
    throw new Error("resourceName is not found in `EXSYS_API_IDS`");
  }

  return await createFetchRequest({
    baseAPiUrl: xBaseApiUrl,
    resourceName: resourceNameUrl,
    requestParams,
    requestMethod,
    requestHeaders,
    transformApiResults,
    body,
    retryTimes,
    retryDelay,
  });
};

export default createExsysRequest;
