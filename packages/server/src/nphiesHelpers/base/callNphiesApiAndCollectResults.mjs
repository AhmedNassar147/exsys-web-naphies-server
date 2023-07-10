/*
 *
 * Helper: `callNphiesApiAndCollectResults`.
 *
 */
// import { writeResultFile } from "@exsys-web-server/helpers";
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

    // const { message_event } = exsysResultsData;
    // if (message_event && message_event.includes("priorauth-")) {
    //   await writeResultFile({
    //     folderName: "preauth-test",
    //     data: {
    //       exsysResultsData,
    //       nodeServerDataSentToNaphies: nphiesRequestPayload,
    //     },
    //     isError: false,
    //   });
    // }

    const nphiesResults = await createNphiesRequest({
      bodyData: nphiesRequestPayload,
    });

    const { isSuccess, result: nphiesResponse, ...restResult } = nphiesResults;

    let nphiesResultData = {
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
