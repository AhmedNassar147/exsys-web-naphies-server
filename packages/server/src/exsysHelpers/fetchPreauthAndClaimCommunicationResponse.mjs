/*
 *
 * Helper: `fetchPreauthAndClaimCommunicationResponse`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
import convertSupportInfoAttachmentUrlsToBase64 from "../nphiesHelpers/base/convertSupportInfoAttachmentUrlsToBase64.mjs";
import createBaseFetchExsysDataAndCallNphiesApi from "./createBaseFetchExsysDataAndCallNphiesApi.mjs";
import extractClaimResponseData from "../nphiesHelpers/extraction/extractClaimResponseData.mjs";
import extractCommunicationData from "../nphiesHelpers/extraction/extractCommunicationData.mjs";
import extractCoverageEntryResponseData from "../nphiesHelpers/extraction/extractCoverageEntryResponseData.mjs";
import validateSupportInfoDataBeforeCallingNphies from "../nphiesHelpers/base/validateSupportInfoDataBeforeCallingNphies.mjs";
import createNphiesRequestPayloadFn from "../nphiesHelpers/communication/index.mjs";
import savePreauthPollDataToExsys from "../polls/savePreauthPollDataToExsys.mjs";
import { EXSYS_API_IDS_NAMES, NPHIES_RESOURCE_TYPES } from "../constants.mjs";

const { COVERAGE } = NPHIES_RESOURCE_TYPES;

const { collectExsysClaimOrPreauthCommunicationData } = EXSYS_API_IDS_NAMES;

const extractionFunctionsMap = {
  [COVERAGE]: extractCoverageEntryResponseData,
  ClaimResponse: extractClaimResponseData,
  Communication: extractCommunicationData,
  CommunicationRequest: extractCommunicationData,
};

// const createExsysSaveApiParams = ({
//   primaryKey,
//   exsysDataApiPrimaryKeyName,
//   nphiesExtractedData: {
//     bundleId,
//     claimRequestId,
//     claimResponseId,
//     claimOutcome,
//     claimExtensionCode,
//     creationBundleId,
//   },
// }) => ({
//   [exsysDataApiPrimaryKeyName]: primaryKey,
//   bundle_id: bundleId,
//   claim_request_id: claimRequestId,
//   claim_response_id: claimResponseId,
//   outcome: claimOutcome,
//   adjudication_outcome: claimExtensionCode,
//   creation_bundle_id: creationBundleId,
//   request_type: "request",
// });

const createExsysErrorSaveApiBody = (errorMessage) => ({
  nphiesExtractedData: {
    claimOutcome: "error",
    issueError: errorMessage,
  },
});

const createResultsDataFromExsysResponse = async ({
  communication_payload,
  ...result
}) => ({
  ...result,
  communication_payload: await convertSupportInfoAttachmentUrlsToBase64(
    communication_payload
  ),
});

const fetchPreauthAndClaimCommunicationResponse = async ({
  requestParams,
  exsysQueryApiDelayTimeout,
  nphiesApiDelayTimeout,
}) => {
  const { authorization, request_type } = requestParams;

  const onNphiesResponseWithSuccessFn = async ({
    nphiesExtractedData,
    ...options
  }) => {
    const { claimRequestId, claimPreauthRef, claimResponseId, productsData } =
      nphiesExtractedData || {};

    if (
      claimRequestId &&
      claimResponseId &&
      claimPreauthRef &&
      isArrayHasData(productsData)
    ) {
      await savePreauthPollDataToExsys({
        authorization,
        nphiesExtractedData,
        requestType: request_type,
        ...options,
      });
    }
  };

  return await createBaseFetchExsysDataAndCallNphiesApi({
    exsysQueryApiId: collectExsysClaimOrPreauthCommunicationData,
    // exsysSaveApiId,
    requestParams,
    requestMethod: "GET",
    printFolderName: `communication/${request_type}`,
    exsysDataApiPrimaryKeyName: "record_pk",
    createResultsDataFromExsysResponse,
    createNphiesRequestPayloadFn,
    extractionFunctionsMap,
    // setErrorIfExtractedDataFoundFn,
    // createExsysSaveApiParams,
    createExsysErrorSaveApiBody,
    // onNphiesResponseWithSuccessFn,
    checkExsysDataValidationBeforeCallingNphies:
      validateSupportInfoDataBeforeCallingNphies("communication_payload"),
    exsysQueryApiDelayTimeout,
    nphiesApiDelayTimeout,
  });
};

export default fetchPreauthAndClaimCommunicationResponse;
