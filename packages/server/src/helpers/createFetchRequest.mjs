/*
 *
 * Helper: `createFetchRequest`.
 *
 */
import chalk from "chalk";
import axios from "axios";
import { delayProcess, createCmdMessage } from "@exsys-web-server/helpers";
import { BASE_API_HEADERS, HTTP_STATUS_CODE } from "../constants.mjs";

const createFetchRequest = (options) => {
  const {
    baseAPiUrl,
    resourceName,
    requestParams,
    requestMethod = "POST",
    requestHeaders = BASE_API_HEADERS,
    httpsAgent,
    body,
    transformApiResults,
    httpStatusCodes = HTTP_STATUS_CODE,
    retryTimes = 0,
    retryDelay = 0,
    errorMessage = "something went wrong",
  } = options;

  let currentResourceName = resourceName;

  if (requestParams) {
    const searchParams = new URLSearchParams(requestParams);
    currentResourceName += `?${searchParams.toString()}`;
  }

  const API_URL = currentResourceName
    ? `${baseAPiUrl}/${currentResourceName}`
    : baseAPiUrl;

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
          const { status, data } = apiResponse;
          const message = httpStatusCodes[status];
          const isSuccess = message === "success";

          const baseValues = {
            status,
            isSuccess,
            error: isSuccess ? undefined : message,
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
          const { response } = error || {};
          const { data: responseData, status } = response || {};
          if (n > 0) {
            await delayProcess(retryDelay);
            wrapper(--n);
          } else {
            createCmdMessage({
              type: "error",
              message: `${errorMessage} when calling ${chalk.white.bold(
                API_URL
              )}`,
            });
            resolve({
              isSuccess: false,
              error: errorMessage,
              status,
              result: responseData,
            });
          }
        });
    };

    wrapper(retryTimes);
  });
};

export default createFetchRequest;
