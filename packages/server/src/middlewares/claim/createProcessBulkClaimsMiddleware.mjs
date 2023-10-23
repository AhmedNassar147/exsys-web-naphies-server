/*
 *
 * `createProcessBulkClaimsMiddleware`: `middleware`
 *
 */
import {
  createPrintResultsOrLog,
  delayProcess,
  isArrayHasData,
  writeResultFile,
} from "@exsys-web-server/helpers";
import createProcessBulkClaimsMiddleware from "../../helpers/createBaseExpressMiddleware.mjs";
import createExsysRequest from "../../helpers/createExsysRequest.mjs";
import {
  EXSYS_API_IDS_NAMES,
  EXSYS_API_IDS,
  BASE_RESULT_FOLDER_BATH,
} from "../../constants.mjs";
import createMappedClaimOrPreauthCancellation from "../../exsysHelpers/createMappedClaimOrPreauthCancellationOrStatusCheck.mjs";
import createMappedClaimRequests from "../../exsysHelpers/createMappedClaimRequests.mjs";

const { queryBulkClaimsDataToCancellationOrCreation } = EXSYS_API_IDS_NAMES;
const exsysApiBaseUrl =
  EXSYS_API_IDS[queryBulkClaimsDataToCancellationOrCreation];

const claimsToBeSentToNphiesPerRequestsMap = 5;

export default createProcessBulkClaimsMiddleware(
  async ({ authorization, data, printValues = false }) => {
    const [baseRequestParams] = data;

    const requestParams = {
      ...baseRequestParams,
      authorization,
    };

    const { request_type, soa_no, nphies_request_type } = baseRequestParams;

    const cancellationFolderRegexp = new RegExp(
      `cancellation/${nphies_request_type}\/`
    );
    const nphiesRequestTypeFolderRegexp = new RegExp(
      `${nphies_request_type}\/`
    );

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

    const basePrintFolderName = `${BASE_RESULT_FOLDER_BATH}/bulkClaim/${request_type}/${nphies_request_type}/${soa_no}`;

    const printData = {
      folderName: basePrintFolderName,
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
      ? createMappedClaimOrPreauthCancellation
      : createMappedClaimRequests;

    let results = [];
    let printInfoData = {};

    while (claims.length) {
      const data = claims.splice(0, claimsToBeSentToNphiesPerRequestsMap);

      const { resultsData, printInfo } = await mappedRequestsFn({
        data,
        authorization,
        printValues: false,
        formatReturnedResults: ({ printInfo, resultsData }) => ({
          printInfo,
          resultsData,
        }),
      });

      if (isArrayHasData(resultsData)) {
        results = results.concat(...resultsData);
      }

      if (printInfo && isArrayHasData(printInfo.data)) {
        const { folderName, data } = printInfo;
        const folderData = printInfoData[folderName] || [];
        printInfoData[folderName] = folderData.concat(...data);
      }

      if (!!claims.length) {
        await delayProcess(6000);
      }
    }

    if (printValues) {
      const keys = Object.keys(printInfoData);

      await Promise.all(
        keys.map((folderName) => {
          const regexp = isClaimCancellation
            ? cancellationFolderRegexp
            : nphiesRequestTypeFolderRegexp;

          const _folderName = folderName.replace(regexp, "");

          return writeResultFile({
            folderName: `${basePrintFolderName}/${_folderName}`,
            data: printInfoData[folderName],
          });
        })
      );
    }

    return results;
  }
);
