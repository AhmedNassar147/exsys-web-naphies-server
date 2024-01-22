/*
 *
 * Helper: `fetchPreauthAndClaimCommunicationResponse`.
 *
 */
import convertSupportInfoAttachmentUrlsToBase64 from "../nphiesHelpers/base/convertSupportInfoAttachmentUrlsToBase64.mjs";
import createBaseFetchExsysDataAndCallNphiesApi from "./createBaseFetchExsysDataAndCallNphiesApi.mjs";
import validateSupportInfoDataBeforeCallingNphies from "../nphiesHelpers/base/validateSupportInfoDataBeforeCallingNphies.mjs";
import createNphiesRequestPayloadFn from "../nphiesHelpers/communication/index.mjs";
import { EXSYS_API_IDS_NAMES } from "../constants.mjs";
import formatNphiesResponseIssue from "../nphiesHelpers/base/formatNphiesResponseIssue.mjs";

const {
  collectExsysClaimOrPreauthCommunicationData,
  collectExsysClaimOrPreauthCommunicationRequestData,
  saveExsysClaimOrPreauthCommunicationData,
} = EXSYS_API_IDS_NAMES;

const extractionFunctionsMap = {
  MessageHeader: ({ resource: { id, response } }) => {
    const { identifier, code } = response || {};

    const outcome = code || "error";

    return {
      communicationRequestId: identifier,
      communicationResponseId: id,
      communicationStatus: code,
      communicationOutcome: outcome.includes("error") ? "error" : outcome,
    };
  },
  OperationOutcome: ({ resource: { issue } }) =>
    formatNphiesResponseIssue(issue),
};

const createExsysSaveApiParams = ({
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
    ? "communicationRequest"
    : "communication";

  return await createBaseFetchExsysDataAndCallNphiesApi({
    exsysQueryApiId,
    exsysSaveApiId: saveExsysClaimOrPreauthCommunicationData,
    requestParams,
    requestMethod: "GET",
    printFolderName: `${basePrintFolder}/${request_type}/${communication_pk}`,
    exsysDataApiPrimaryKeyName: "communication_pk",
    createResultsDataFromExsysResponse,
    createNphiesRequestPayloadFn,
    extractionFunctionsMap,
    // setErrorIfExtractedDataFoundFn,
    createExsysSaveApiParams,
    createExsysErrorSaveApiBody,
    checkExsysDataValidationBeforeCallingNphies,
  });
};

export default fetchPreauthAndClaimCommunicationResponse;
