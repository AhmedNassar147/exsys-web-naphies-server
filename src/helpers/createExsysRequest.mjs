/*
 *
 * Helper: `createExsysRequest`.
 *
 */
import createFetchRequest from "./createFetchRequest.mjs";
import { EXSYS_BASE_URL, EXSYS_API_IDS } from "../constants.mjs";

const createExsysRequest = async ({
  xBaseApiUrl = EXSYS_BASE_URL,
  resourceName,
  requestParams,
  requestMethod,
  requestHeaders,
  transformApiResults,
  body,
  retryTimes,
  retryDelay,
}) => {
  const resourceNameUrl = EXSYS_API_IDS[resourceName];

  if (!resourceNameUrl) {
    throw new Error("resourceName is not found in `EXSYS_API_IDS`");
  }

  let currentResourceName = resourceNameUrl;

  if (requestParams) {
    const searchParams = new URLSearchParams(requestParams);
    currentResourceName += `?${searchParams.toString()}`;
  }

  return await createFetchRequest({
    baseAPiUrl: xBaseApiUrl,
    resourceName: currentResourceName,
    requestMethod,
    requestHeaders,
    transformApiResults,
    body,
    retryTimes,
    retryDelay,
  });
};

export default createExsysRequest;
