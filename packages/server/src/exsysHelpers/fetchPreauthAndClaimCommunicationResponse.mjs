/*
 *
 * Helper: `fetchPreauthAndClaimCommunicationResponse`.
 *
 */
import convertSupportInfoAttachmentUrlsToBase64 from "../nphiesHelpers/base/convertSupportInfoAttachmentUrlsToBase64.mjs";
import createBaseFetchExsysDataAndCallNphiesApi from "./createBaseFetchExsysDataAndCallNphiesApi.mjs";
import extractCommunicationData from "../nphiesHelpers/extraction/extractCommunicationData.mjs";
import extractCoverageEntryResponseData from "../nphiesHelpers/extraction/extractCoverageEntryResponseData.mjs";
import validateSupportInfoDataBeforeCallingNphies from "../nphiesHelpers/base/validateSupportInfoDataBeforeCallingNphies.mjs";
import createNphiesRequestPayloadFn from "../nphiesHelpers/communication/index.mjs";
import { EXSYS_API_IDS_NAMES, NPHIES_RESOURCE_TYPES } from "../constants.mjs";

const { COVERAGE } = NPHIES_RESOURCE_TYPES;

const {
  collectExsysClaimOrPreauthCommunicationData,
  saveExsysClaimOrPreauthCommunicationData,
} = EXSYS_API_IDS_NAMES;

const extractionFunctionsMap = {
  [COVERAGE]: extractCoverageEntryResponseData,
  Communication: extractCommunicationData,
  CommunicationRequest: extractCommunicationData,
};

const createExsysSaveApiParams = ({
  primaryKey,
  exsysDataApiPrimaryKeyName,
  nphiesExtractedData: {
    bundleId,
    communicationId,
    communicationStatus,
    creationBundleId,
    communicationIdentifier,
    issueError,
    issueErrorCode,
  },
}) => {
  const status =
    !communicationStatus || !!issueError || !!issueErrorCode
      ? "error"
      : communicationStatus;

  return {
    [exsysDataApiPrimaryKeyName]: primaryKey,
    outcome: status,
    creation_bundle_id: creationBundleId,
    bundle_id: bundleId,
    communication_id: communicationId,
    communication_identifier: communicationIdentifier,
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
  communication_about_type,
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
  const { request_type, communicationPk } = requestParams;

  const checkExsysDataValidationBeforeCallingNphies =
    validateSupportInfoDataBeforeCallingNphies("communication_payload", true);

  return await createBaseFetchExsysDataAndCallNphiesApi({
    exsysQueryApiId: collectExsysClaimOrPreauthCommunicationData,
    exsysSaveApiId: saveExsysClaimOrPreauthCommunicationData,
    requestParams,
    requestMethod: "GET",
    printFolderName: `communication/${request_type}/${communicationPk}`,
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
