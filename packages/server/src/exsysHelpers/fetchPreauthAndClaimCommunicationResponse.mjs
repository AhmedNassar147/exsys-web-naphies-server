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

const {
  collectExsysClaimOrPreauthCommunicationData,
  saveExsysClaimOrPreauthCommunicationData,
} = EXSYS_API_IDS_NAMES;

const extractionFunctionsMap = {
  MessageHeader: ({ resource: { id, response } }) => {
    const { identifier, code } = response || {};

    return {
      bundleId: id,
      communicationStatus: code,
      communicationId: identifier,
    };
  },
};

const createExsysSaveApiParams = ({
  primaryKey,
  exsysSaveApiPrimaryKeyName,
  nphiesExtractedData: {
    bundleId,
    creationBundleId,
    communicationStatus,
    communicationId,
    issueError,
    issueErrorCode,
  },
}) => {
  const status =
    !communicationStatus || !!issueError || !!issueErrorCode
      ? "error"
      : communicationStatus;

  return {
    [exsysSaveApiPrimaryKeyName]: primaryKey,
    creation_bundle_id: creationBundleId,
    outcome: status,
    bundle_id: bundleId,
    communication_id: communicationId,
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
  const { request_type, communication_pk } = requestParams;

  const checkExsysDataValidationBeforeCallingNphies =
    validateSupportInfoDataBeforeCallingNphies("communication_payload", true);

  return await createBaseFetchExsysDataAndCallNphiesApi({
    exsysQueryApiId: collectExsysClaimOrPreauthCommunicationData,
    exsysSaveApiId: saveExsysClaimOrPreauthCommunicationData,
    requestParams,
    requestMethod: "GET",
    printFolderName: `communication/${request_type}/${communication_pk}`,
    exsysDataApiPrimaryKeyName: "communication_pk",
    createResultsDataFromExsysResponse,
    createNphiesRequestPayloadFn,
    extractionFunctionsMap,
    // setErrorIfExtractedDataFoundFn,
    createExsysSaveApiParams,
    createExsysErrorSaveApiBody,
    checkExsysDataValidationBeforeCallingNphies,
    exsysQueryApiDelayTimeout,
    nphiesApiDelayTimeout,
  });
};

export default fetchPreauthAndClaimCommunicationResponse;
