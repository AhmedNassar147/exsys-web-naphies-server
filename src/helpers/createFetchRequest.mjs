/*
 *
 * Helper: `createFetchRequest`.
 *
 */
import nodeFetch from "node-fetch";
import { BASE_API_HEADERS, HTTP_STATUS_CODE } from "../constants.mjs";

const getApiResult = async (contentType, response) => {
  if (contentType.includes("application/json")) {
    return await response.json();
  }

  if (contentType.includes("application/text")) {
    return await response.text();
  }

  return {};
};

const delay = (ms) => new Promise((resolve) => setTimeout(() => resolve(), ms));

const createFetchRequest = (options) => {
  const {
    baseAPiUrl,
    resourceName,
    requestMethod = "POST",
    requestHeaders = BASE_API_HEADERS,
    body,
    transformApiResults,
    httpStatusCodes = HTTP_STATUS_CODE,
    retryTimes = 0,
    retryDelay = 0,
  } = options;
  const API_URL = `${baseAPiUrl}${resourceName ? `/${resourceName}` : ""}`;

  const fetchOptions = {
    method: requestMethod,
    headers: requestHeaders,
    ...(body
      ? {
          body: JSON.stringify(body),
        }
      : null),
  };

  return new Promise(async (resolve) => {
    const wrapper = (n) => {
      nodeFetch(API_URL, fetchOptions)
        .then(async (apiResponse) => {
          if (transformApiResults) {
            return resolve(
              await transformApiResults(apiResponse, getApiResult)
            );
          }

          const { status, headers } = apiResponse;
          const contentType = headers.get("content-type") || "";
          const result = await getApiResult(contentType, apiResponse);
          const message = httpStatusCodes[status];
          const isSuccess = message === "success";

          resolve({
            isSuccess,
            error: isSuccess ? "" : message,
            result,
          });
        })
        .catch(async (error) => {
          if (n > 0) {
            await delay(retryDelay);
            wrapper(--n);
          } else {
            console.log("error", error);
            resolve({
              isSuccess: false,
              error: "something went wrong",
              result: undefined,
            });
          }
        });
    };

    wrapper(retryTimes);
  });
};

export default createFetchRequest;
