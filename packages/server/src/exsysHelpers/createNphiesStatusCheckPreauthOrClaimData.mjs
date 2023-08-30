/*
 *
 * Helper: `createNphiesStatusCheckPreauthOrClaimData`.
 *
 */
import createBaseFetchExsysDataAndCallNphiesApi from "./createBaseFetchExsysDataAndCallNphiesApi.mjs";
import extractPreauthOrClaimCancellationResponseData from "../nphiesHelpers/extraction/extractPreauthOrClaimCancellationResponseData.mjs";
import createNphiesRequestPayloadFn from "../nphiesHelpers/preauthorization/createNphiesPreauthOrClaimStatusCheckData.mjs";
import {
  EXSYS_API_IDS_NAMES,
  NPHIES_RESOURCE_TYPES,
  NPHIES_REQUEST_TYPES,
} from "../constants.mjs";

const { queryExsysClaimOrPreauthStatusCheckData } = EXSYS_API_IDS_NAMES;

const extractionFunctionsMap = {
  [NPHIES_RESOURCE_TYPES.TASK]: extractPreauthOrClaimCancellationResponseData,
};

const setErrorIfExtractedDataFoundFn = ({ statusCheckErrors }) =>
  statusCheckErrors || [];

const createExsysErrorSaveApiBody = (errorMessage) => ({
  nphiesExtractedData: {
    outcome: "error",
    Status: "error",
    issueError: errorMessage,
  },
});

const createExsysSaveApiParams = ({
  primaryKey,
  exsysDataApiPrimaryKeyName,
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
    [exsysDataApiPrimaryKeyName]: primaryKey,
    bundle_id: bundleId,
    outcome: _outcome,
    creation_bundle_id: creationBundleId,
  };
};

const createNphiesStatusCheckPreauthOrClaimData = async ({
  requestParams,
  exsysQueryApiDelayTimeout,
  nphiesApiDelayTimeout,
}) => {
  const { record_pk, request_type } = requestParams;

  const isClaimCancellationRequest =
    request_type === NPHIES_REQUEST_TYPES.CLAIM;

  const printFolderName = `statusCheck/${request_type}/${record_pk}`;

  // const exsysSaveApiId = isClaimCancellationRequest
  //   ? saveClaimData
  //   : savePreauthData;

  const exsysDataApiPrimaryKeyName = isClaimCancellationRequest
    ? "claim_pk"
    : "preauth_pk";

  return await createBaseFetchExsysDataAndCallNphiesApi({
    exsysQueryApiId: queryExsysClaimOrPreauthStatusCheckData,
    // exsysSaveApiId,
    requestParams,
    requestMethod: "GET",
    printFolderName,
    exsysDataApiPrimaryKeyName,
    createNphiesRequestPayloadFn,
    extractionFunctionsMap,
    setErrorIfExtractedDataFoundFn,
    createExsysSaveApiParams,
    createExsysErrorSaveApiBody,
    exsysQueryApiDelayTimeout,
    nphiesApiDelayTimeout,
  });
};

export default createNphiesStatusCheckPreauthOrClaimData;
