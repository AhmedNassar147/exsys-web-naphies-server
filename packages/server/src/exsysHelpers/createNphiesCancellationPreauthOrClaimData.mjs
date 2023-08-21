/*
 *
 * Helper: `createNphiesCancellationPreauthOrClaimData`.
 *
 */
import createBaseFetchExsysDataAndCallNphiesApi from "./createBaseFetchExsysDataAndCallNphiesApi.mjs";
import extractPreauthOrClaimCancellationResponseData from "../nphiesHelpers/extraction/extractPreauthOrClaimCancellationResponseData.mjs";
import createNphiesRequestPayloadFn from "../nphiesHelpers/preauthorization/createNphiesPreauthOrClaimCancellationData.mjs";
import {
  EXSYS_API_IDS_NAMES,
  NPHIES_RESOURCE_TYPES,
  NPHIES_REQUEST_TYPES,
} from "../constants.mjs";

const {
  queryClaimOrPreauthDataToCancellation,
  savePreauthData,
  saveClaimData,
} = EXSYS_API_IDS_NAMES;

const extractionFunctionsMap = {
  [NPHIES_RESOURCE_TYPES.TASK]: extractPreauthOrClaimCancellationResponseData,
};

const setErrorIfExtractedDataFoundFn = ({ cancellationErrors }) =>
  cancellationErrors || [];

const createExsysErrorSaveApiBody = (errorMessage) => ({
  nphiesExtractedData: {
    cancellationOutcome: "error",
    cancellationStatus: "error",
    issueError: errorMessage,
  },
});

const createExsysSaveApiParams = ({
  primaryKey,
  exsysSaveApiPrimaryKeyName,
  nphiesExtractedData: {
    bundleId,
    cancellationStatus,
    creationBundleId,
    issueError,
    issueErrorCode,
  },
}) => {
  const _outcome =
    !cancellationStatus || !!issueError || !!issueErrorCode
      ? "error"
      : cancellationStatus;

  return {
    [exsysSaveApiPrimaryKeyName]: primaryKey,
    bundle_id: bundleId,
    outcome: _outcome,
    creation_bundle_id: creationBundleId,
    request_type: "cancel",
  };
};

const createNphiesCancellationPreauthOrClaimData = async ({
  requestParams,
  exsysQueryApiDelayTimeout,
  nphiesApiDelayTimeout,
}) => {
  const { record_pk, request_type } = requestParams;

  const isClaimCancellationRequest =
    request_type === NPHIES_REQUEST_TYPES.CLAIM;

  const printFolderName = `cancellation/${request_type}/${record_pk}`;

  const exsysSaveApiId = isClaimCancellationRequest
    ? saveClaimData
    : savePreauthData;

  const saveApiPrimaryKey = isClaimCancellationRequest
    ? "claim_pk"
    : "preauth_pk";

  return await createBaseFetchExsysDataAndCallNphiesApi({
    exsysQueryApiId: queryClaimOrPreauthDataToCancellation,
    exsysSaveApiId,
    requestParams,
    requestMethod: "GET",
    printFolderName,
    exsysDataApiPrimaryKeyName: "record_pk",
    exsysSaveApiPrimaryKeyName: saveApiPrimaryKey,
    createNphiesRequestPayloadFn,
    extractionFunctionsMap,
    setErrorIfExtractedDataFoundFn,
    createExsysSaveApiParams,
    createExsysErrorSaveApiBody,
    exsysQueryApiDelayTimeout,
    nphiesApiDelayTimeout,
  });
};

export default createNphiesCancellationPreauthOrClaimData;
