/*
 *
 * Helper: `createWasselRequest`.
 *
 */
import createFetchRequest from "./createFetchRequest.mjs";
import { getLocalStorageItem } from "../nodeHelpers/localStorage.mjs";
import {
  BASE_API_HEADERS,
  WASSEL_CONSTANTS,
  WASSEL_API_NAMES,
} from "../constants.mjs";

const { baseAPiUrl, resourceNames, HTTP_STATUS_CODE } = WASSEL_CONSTANTS;
const { CREATE_TOKEN } = WASSEL_API_NAMES;

const createWasselRequest = async ({
  xBaseApiUrl = baseAPiUrl,
  resourceName,
  requestParams,
  ...options
}) => {
  const createRequestHeaders = async () => {
    if (resourceName === CREATE_TOKEN) {
      return BASE_API_HEADERS;
    }

    const { access_token, token_type } =
      (await getLocalStorageItem({
        fileName: "tokens",
        key: "wassel",
      })) || {};

    return {
      ...BASE_API_HEADERS,
      Authorization: `${token_type || "Bearer"} ${access_token}`,
    };
  };

  const curredRequestHeaders = await createRequestHeaders();

  let currentResourceName = resourceNames[resourceName];

  if (requestParams) {
    Object.keys(requestParams).forEach((key) => {
      currentResourceName = currentResourceName.replace(
        `:${key}`,
        requestParams[key]
      );
    });
  }

  return await createFetchRequest({
    baseAPiUrl: xBaseApiUrl,
    resourceName: currentResourceName,
    requestHeaders: curredRequestHeaders,
    httpStatusCodes: HTTP_STATUS_CODE,
    ...options,
  });
};

export default createWasselRequest;
