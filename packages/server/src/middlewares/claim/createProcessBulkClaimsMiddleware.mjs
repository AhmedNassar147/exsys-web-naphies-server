/*
 *
 * `createProcessBulkClaimsMiddleware`: `middleware`
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
import createProcessBulkClaimsMiddleware from "../../helpers/createBaseExpressMiddleware.mjs";
import createExsysRequest from "../../helpers/createExsysRequest.mjs";
import { EXSYS_API_IDS_NAMES, EXSYS_API_IDS } from "../../constants.mjs";
import createMappedClaimRequestsToCancellation from "../../exsysHelpers/createMappedClaimRequestsToCancellation.mjs";
import createMappedClaimRequests from "../../exsysHelpers/createMappedClaimRequests.mjs";

const { queryUnwantedClaimsDataToCancellation } = EXSYS_API_IDS_NAMES;
const exsysApiBaseUrl = EXSYS_API_IDS[queryUnwantedClaimsDataToCancellation];

const claimsToBeSentToNphiesPerRequestsMap = 30;

export default createProcessBulkClaimsMiddleware(
  async ({ authorization, data, printValues = false }) => {
    const [baseRequestParams] = data;

    const requestParams = {
      ...baseRequestParams,
      authorization,
    };

    const { request_type } = baseRequestParams;

    const {
      isSuccess,
      error,
      result: exsysResultsData,
    } = await createExsysRequest({
      resourceName: queryBulkClaimsDataToCancellationOrCreation,
      requestMethod: "GET",
      retryTimes: 0,
      requestParams,
    });

    const printedErrorData = {
      requestParams,
      exsysResultsData,
    };

    const printData = {
      folderName: `bulkClaim/${request_type}`,
      data: printedErrorData,
      hasExsysApiError: true,
    };

    if (!isSuccess || error) {
      const errorMessage = error || `Error when calling ${exsysApiBaseUrl}`;

      return [
        {
          printData,
          loggerValue: errorMessage,
          resultData: {
            errorMessage,
            hasError: true,
          },
        },
      ];
    }

    if (!isArrayHasData(exsysResultsData)) {
      const errorMessage = `No claims found to be ${request_type}`;

      return [
        {
          printData: {
            ...printData,
            hasExsysApiError: false,
          },
          loggerValue: errorMessage,
          resultData: {
            errorMessage,
            hasError: false,
          },
        },
      ];
    }

    const claims = structuredClone(exsysResultsData);
    const isClaimCancellation = request_type === "cancel";

    const mappedRequestsFn = isClaimCancellation
      ? createMappedClaimRequestsToCancellation
      : createMappedClaimRequests;

    let results = [];

    while (claims.length) {
      const data = claims.slice(0, claimsToBeSentToNphiesPerRequestsMap);

      const newResults = await mappedRequestsFn({
        data,
        authorization,
        printValues,
      });

      results = results.concat(...newResults);
    }

    return results;
  }
);
