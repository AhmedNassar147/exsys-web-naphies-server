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
  checkPayloadNphiesSize,
}) =>
  new Promise(async (resolve) => {
    const { organizationNo, organization_no, clinicalEntityNo, clientName } =
      exsysResultsData;

    const nphiesRequestPayload = createNphiesRequestPayloadFn(exsysResultsData);

    if (checkPayloadNphiesSize) {
      const sizeInBytes = Buffer.byteLength(
        JSON.stringify(nphiesRequestPayload)
      );
      const megaBytes = sizeInBytes / 1e6;

      if (megaBytes > 11) {
        const nphiesResultData = {
          isSuccess: false,
          ...(otherPrintValues || null),
          exsysResultsData,
          nodeServerDataSentToNaphies: nphiesRequestPayload,
        };

        resolve({
          nphiesResultData,
          errorMessage: "Nphies payload exceeded the limit (11 MB)",
          errorMessageCode: "SIZE_LIMIT_EXCEEDED",
          hasError: true,
          isNphiesServerConnected: true,
        });
      }
    }

    const nphiesResults = await createNphiesRequest({
      bodyData: nphiesRequestPayload,
      organizationNo: organizationNo || organization_no,
      clinicalEntityNo,
      clientName,
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
