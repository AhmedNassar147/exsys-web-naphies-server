/*
 *
 * Helper: `fetchPreauthAndClaimCommunicationResponse`.
 *
 */
import convertSupportInfoAttachmentUrlsToBase64 from "../nphiesHelpers/base/convertSupportInfoAttachmentUrlsToBase64.mjs";
import createBaseFetchExsysDataAndCallNphiesApi from "./createBaseFetchExsysDataAndCallNphiesApi.mjs";
import validateSupportInfoDataBeforeCallingNphies from "../nphiesHelpers/base/validateSupportInfoDataBeforeCallingNphies.mjs";
import createNphiesRequestPayloadFn from "../nphiesHelpers/communication/index.mjs";
import { EXSYS_API_IDS_NAMES, NPHIES_REQUEST_TYPES } from "../constants.mjs";

const {
  collectExsysClaimOrPreauthCommunicationData,
  collectExsysClaimOrPreauthCommunicationRequestData,
  saveExsysClaimOrPreauthCommunicationData,
} = EXSYS_API_IDS_NAMES;

const createExsysSaveApiParams =
  (is_communication_request) =>
  ({
    primaryKey,
    exsysDataApiPrimaryKeyName,
    nphiesExtractedData: {
      bundleId,
      creationBundleId,
      communicationStatus,
      communicationOutcome,
      communicationRequestId,
      communicationResponseId,
      issueError,
      issueErrorCode,
    },
  }) => {
    const status =
      !communicationOutcome || !!issueError || !!issueErrorCode
        ? "error"
        : communicationOutcome;

    return {
      [exsysDataApiPrimaryKeyName]: primaryKey,
      bundle_id: bundleId,
      creation_bundle_id: creationBundleId,
      outcome: status,
      communication_id: communicationRequestId,
      communication_status: communicationStatus,
      communication_response_id: communicationResponseId,
      is_communication_request,
    };
  };

const createExsysErrorSaveApiBody = (errorMessage) => ({
  nphiesExtractedData: {
    outcome: "error",
    issueError: errorMessage,
  },
});

const createResultsDataFromExsysResponse = async ({
  communication_payload,
  ...result
}) => {
  return {
    ...result,
    communication_payload: await convertSupportInfoAttachmentUrlsToBase64(
      communication_payload
    ),
  };
};

const fetchPreauthAndClaimCommunicationResponse = async ({
  requestParams,
  isCommunicationRequest,
}) => {
  const { request_type, communication_pk } = requestParams;

  const checkExsysDataValidationBeforeCallingNphies =
    validateSupportInfoDataBeforeCallingNphies("communication_payload", true);

  const exsysQueryApiId = isCommunicationRequest
    ? collectExsysClaimOrPreauthCommunicationRequestData
    : collectExsysClaimOrPreauthCommunicationData;

  const basePrintFolder = isCommunicationRequest
    ? NPHIES_REQUEST_TYPES.COMMUNICATION_REQUEST
    : NPHIES_REQUEST_TYPES.COMMUNICATION;

  return await createBaseFetchExsysDataAndCallNphiesApi({
    exsysQueryApiId,
    exsysSaveApiId: saveExsysClaimOrPreauthCommunicationData,
    requestParams,
    requestMethod: "GET",
    printFolderName: `${basePrintFolder}/${request_type}/${communication_pk}`,
    exsysDataApiPrimaryKeyName: "communication_pk",
    createResultsDataFromExsysResponse,
    createNphiesRequestPayloadFn,
    extractionRequestType: basePrintFolder,
    createExsysSaveApiParams: createExsysSaveApiParams(
      isCommunicationRequest ? "Y" : "N"
    ),
    createExsysErrorSaveApiBody,
    checkExsysDataValidationBeforeCallingNphies,
  });
};

export default fetchPreauthAndClaimCommunicationResponse;
