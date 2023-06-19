/*
 *
 * Helper: `createFetchRequest`.
 *
 */
import axios from "axios";
import { writeFile } from "fs/promises";
import { BASE_API_HEADERS, HTTP_STATUS_CODE } from "../constants.mjs";

const delay = (ms) => new Promise((resolve) => setTimeout(() => resolve(), ms));

const createFetchRequest = (options) => {
  const {
    baseAPiUrl,
    resourceName,
    requestMethod = "POST",
    requestHeaders = BASE_API_HEADERS,
    httpsAgent,
    body,
    transformApiResults,
    httpStatusCodes = HTTP_STATUS_CODE,
    retryTimes = 0,
    retryDelay = 0,
  } = options;
  const API_URL = resourceName ? `${baseAPiUrl}/${resourceName}` : baseAPiUrl;

  const fetchOptions = {
    method: requestMethod,
    headers: requestHeaders,
    httpsAgent,
    data: body,
    url: API_URL,
  };

  return new Promise((resolve) => {
    const wrapper = (n) => {
      axios(fetchOptions)
        .then((apiResponse) => {
          // console.log("apiResponse", apiResponse);
          const { status, data } = apiResponse;
          const message = httpStatusCodes[status];
          const isSuccess = message === "success";

          const baseValues = {
            isSuccess,
            error: isSuccess ? "" : message,
          };

          if (transformApiResults) {
            const result = transformApiResults(apiResponse);
            return resolve({
              ...baseValues,
              result,
            });
          }

          resolve({
            ...baseValues,
            result: data,
          });
        })
        .catch(async (error) => {
          const { response: nafiesResponse } = error || {};
          const { data: nafiesResponseData, status } = nafiesResponse || {};
          await writeFile(
            "./abc-result-error.json",
            JSON.stringify({ nafiesResponseData, status }, null, 2)
          );

          if (n > 0) {
            await delay(retryDelay);
            wrapper(--n);
          } else {
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
