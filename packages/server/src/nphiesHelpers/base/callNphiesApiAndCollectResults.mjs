/*
 *
 * Helper: `callNphiesApiAndCollectResults`.
 *
 */
import createNphiesRequest from "../../helpers/createNphiesRequest.mjs";
import mapEntriesAndExtractNeededData from "../extraction/mapEntriesAndExtractNeededData.mjs";
import convertSentAttachmentBase64ToFileUrl from "./convertSentAttachmentBase64ToFileUrl.mjs";

const callNphiesAPIAndCollectResults = ({
  exsysResultsData,
  createNphiesRequestPayloadFn,
  otherPrintValues,
  setErrorIfExtractedDataFoundFn,
  checkPayloadNphiesSize,
  extractionRequestType,
}) =>
  new Promise(async (resolve) => {
    const { organizationNo, organization_no, clinicalEntityNo } =
      exsysResultsData;

    const nphiesRequestPayload = createNphiesRequestPayloadFn(exsysResultsData);

    const convertedNphiesRequestPayload =
      convertSentAttachmentBase64ToFileUrl(nphiesRequestPayload);

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
          nodeServerDataSentToNaphies: convertedNphiesRequestPayload,
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
    });

    const { isSuccess, result: nphiesResponse, ...restResult } = nphiesResults;

    const nphiesResultData = {
      isSuccess,
      ...restResult,
      ...(otherPrintValues || null),
      exsysResultsData,
      nodeServerDataSentToNaphies: convertedNphiesRequestPayload,
      nphiesResponse,
    };

    const { servlet, message, status } = nphiesResponse || {};

    let errorMessage = [restResult.error, servlet, message]
      .filter(Boolean)
      .join(" ");
    let errorMessageCode = isSuccess ? undefined : status;
    let hasError = !isSuccess;

    const { id: mainBundleId } = nphiesResponse || {};

    const isNphiesServerConnected = !!mainBundleId;

    if (isNphiesServerConnected) {
      const extractedData = mapEntriesAndExtractNeededData({
        requestType: extractionRequestType,
        nphiesResponse,
        nodeServerDataSentToNaphies: nphiesRequestPayload,
      });

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
