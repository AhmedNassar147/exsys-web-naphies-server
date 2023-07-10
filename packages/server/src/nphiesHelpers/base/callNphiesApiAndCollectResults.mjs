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
}) =>
  new Promise(async (resolve) => {
    const nphiesRequestPayload = createNphiesRequestPayloadFn(exsysResultsData);

    const nphiesResults = await createNphiesRequest({
      bodyData: nphiesRequestPayload,
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

    let errorMessage = restResult.error;
    let errorMessageCode = undefined;
    let hasError = !isSuccess;

    const extractedData = mapEntriesAndExtractNeededData(
      nphiesResponse,
      extractionFunctionsMap
    );

    nphiesResultData.nphiesExtractedData = extractedData;

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

    resolve({ nphiesResultData, errorMessage, errorMessageCode, hasError });
  });

export default callNphiesAPIAndCollectResults;
