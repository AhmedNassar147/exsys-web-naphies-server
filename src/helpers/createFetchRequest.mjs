/*
 *
 * Helper: `createFetchRequest`.
 *
 */
import nodeFetch from "node-fetch";
import { BASE_API_HEADERS } from "../constants.mjs";

const getApiResult = async (contentType, response) => {
  if (contentType.includes("application/json")) {
    return await response.json();
  }

  if (contentType.includes("application/text")) {
    return await response.text();
  }

  return {};
};

const createFetchRequest = ({
  baseAPiUrl,
  resourceName,
  requestMethod = "POST",
  requestHeaders = BASE_API_HEADERS,
  body,
  transformApiResults,
  httpStatusCodes,
}) =>
  new Promise(async (resolve) => {
    const API_URL = `${baseAPiUrl}${resourceName ? `/${resourceName}` : ""}`;
    try {
      const apiResponse = await nodeFetch(API_URL, {
        method: requestMethod,
        headers: requestHeaders,
        ...(body
          ? {
              body: JSON.stringify(body),
            }
          : null),
      });

      if (transformApiResults) {
        return resolve(await transformApiResults(apiResponse));
      }

      const { status, headers } = apiResponse;
      const message = httpStatusCodes[status];
      const isSuccess = message === "success";
      const contentType = headers.get("content-type") || "";
      const result = await getApiResult(contentType, apiResponse);

      resolve({
        isSuccess,
        error: isSuccess ? "" : message,
        result,
      });
    } catch (error) {
      console.log("error", error);
      resolve({
        isSuccess: false,
        error: "something went wrong",
        result: undefined,
      });
    }
  });

export default createFetchRequest;
