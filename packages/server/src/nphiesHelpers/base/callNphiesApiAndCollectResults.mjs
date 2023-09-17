/*
 *
 * Helper: `callNphiesApiAndCollectResults`.
 *
 */
import createNphiesRequest from "../../helpers/createNphiesRequest.mjs";
import mapEntriesAndExtractNeededData from "../extraction/mapEntriesAndExtractNeededData.mjs";

const callNphiesAPIAndCollectResults = ({
  exsysResultsData,
  createNphiesRequestPayloadFn,
  extractionFunctionsMap,
  otherPrintValues,
  setErrorIfExtractedDataFoundFn,
  isAuthorizationPoll,
  nphiesApiDelayTimeout,
}) =>
  new Promise(async (resolve) => {
    const nphiesRequestPayload = createNphiesRequestPayloadFn(exsysResultsData);

    const nphiesResults = await createNphiesRequest({
      bodyData: nphiesRequestPayload,
      startingDelayTimeout: nphiesApiDelayTimeout,
    });

    const { isSuccess, result: nphiesResponse, ...restResult } = nphiesResults;

    const nphiesResultData = {
      isSuccess,
      ...restResult,
      ...(otherPrintValues || null),
      exsysResultsData,
      nodeServerDataSentToNaphies: nphiesRequestPayload,
      nphiesResponse,
    };

    const { servlet, message, status } = nphiesResponse || {};

    let errorMessage = [restResult.error, servlet, message]
      .filter(Boolean)
      .join(" ");
    let errorMessageCode = isSuccess ? undefined : status;
    let hasError = !isSuccess;

    const { id: mainBundleId } = nphiesResponse || {};
    const { id: creationBundleId } = nphiesRequestPayload;

    const isNphiesServerConnected = !!mainBundleId;

    if (isNphiesServerConnected) {
      const extractedData = mapEntriesAndExtractNeededData({
        nphiesResponse,
        extractionFunctionsMap,
        creationBundleId,
      });

      nphiesResultData.nphiesExtractedData =
        isAuthorizationPoll && mainBundleId
          ? {
              mainBundleId,
              ...(extractedData || null),
            }
          : extractedData;

      if (extractedData && setErrorIfExtractedDataFoundFn) {
        const { issueErrorCode, issueError } = extractedData;
        const errors = setErrorIfExtractedDataFoundFn(
          extractedData,
          errorMessage,
          hasError
        );

        if (!errorMessage) {
          errorMessage = issueError;
          errorMessageCode = issueErrorCode;
        }

        if (!hasError) {
          hasError = [issueErrorCode, issueError, ...(errors || [])]
            .filter(Boolean)
            .some((item) => !!item);
        }
      }
    }

    resolve({
      nphiesResultData,
      errorMessage,
      errorMessageCode,
      hasError,
      isNphiesServerConnected,
    });
  });

export default callNphiesAPIAndCollectResults;
