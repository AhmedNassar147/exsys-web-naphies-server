/*
 *
 * `createProcessBulkClaimsMiddleware`: `middleware`
 *
 */
import {
  createPrintResultsOrLog,
  delayProcess,
  isArrayHasData,
} from "@exsys-web-server/helpers";
import createProcessBulkClaimsMiddleware from "../../helpers/createBaseExpressMiddleware.mjs";
import createExsysRequest from "../../helpers/createExsysRequest.mjs";
import { EXSYS_API_IDS_NAMES, EXSYS_API_IDS } from "../../constants.mjs";
import createMappedClaimRequestsToCancellation from "../../exsysHelpers/createMappedClaimRequestsToCancellation.mjs";
import createMappedClaimRequests from "../../exsysHelpers/createMappedClaimRequests.mjs";

const { queryBulkClaimsDataToCancellationOrCreation } = EXSYS_API_IDS_NAMES;
const exsysApiBaseUrl =
  EXSYS_API_IDS[queryBulkClaimsDataToCancellationOrCreation];

const claimsToBeSentToNphiesPerRequestsMap = 30;

export default createProcessBulkClaimsMiddleware(
  async ({ authorization, data, printValues = false }) => {
    const [baseRequestParams] = data;

    const requestParams = {
      ...baseRequestParams,
      authorization,
    };

    const { request_type } = baseRequestParams;

    const { isSuccess, error, result } = await createExsysRequest({
      resourceName: queryBulkClaimsDataToCancellationOrCreation,
      requestMethod: "GET",
      retryTimes: 0,
      requestParams,
    });

    const { data: exsysResultsData } = result || { data: [] };

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

      await createPrintResultsOrLog({
        printValues,
        printData: printData,
        loggerValues: [errorMessage],
      });

      return [
        {
          errorMessage,
          hasError: true,
        },
      ];
    }

    if (!isArrayHasData(exsysResultsData)) {
      const errorMessage = `No claims found to be ${request_type}`;

      await createPrintResultsOrLog({
        printValues,
        printData: {
          ...printData,
          hasExsysApiError: false,
        },
        loggerValues: [errorMessage],
      });

      return [
        {
          errorMessage,
          hasError: false,
        },
      ];
    }

    const claims = [...exsysResultsData];
    const isClaimCancellation = request_type === "cancel";

    const mappedRequestsFn = isClaimCancellation
      ? createMappedClaimRequestsToCancellation
      : createMappedClaimRequests;

    let results = [];

    while (claims.length) {
      const data = claims.splice(0, claimsToBeSentToNphiesPerRequestsMap);

      const newResults = await mappedRequestsFn({
        data,
        authorization,
        printValues,
      });

      results = results.concat(...newResults);

      if (!!claims.length) {
        await delayProcess(200);
      }
    }

    return results;
  }
);
