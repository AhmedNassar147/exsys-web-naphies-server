/*
 *
 * Helper: `createNphiesStatusCheckPreauthOrClaimData`.
 *
 */
import createBaseFetchExsysDataAndCallNphiesApi from "./createBaseFetchExsysDataAndCallNphiesApi.mjs";
import extractPreauthOrClaimStatusCheckResponseData from "../nphiesHelpers/extraction/extractPreauthOrClaimStatusCheckResponseData.mjs";
import createNphiesRequestPayloadFn from "../nphiesHelpers/preauthorization/createNphiesPreauthOrClaimStatusCheckData.mjs";
import {
  EXSYS_API_IDS_NAMES,
  NPHIES_RESOURCE_TYPES,
  NPHIES_REQUEST_TYPES,
} from "../constants.mjs";

const {
  queryExsysClaimOrPreauthStatusCheckData,
  saveExsysClaimOrPreauthStatusCheckData,
} = EXSYS_API_IDS_NAMES;

const extractionFunctionsMap = {
  [NPHIES_RESOURCE_TYPES.TASK]: extractPreauthOrClaimStatusCheckResponseData,
};

const setErrorIfExtractedDataFoundFn = ({ statusCheckErrors }) =>
  statusCheckErrors || [];

const createExsysErrorSaveApiBody = (errorMessage) => ({
  nphiesExtractedData: {
    statusCheckOutcome: "error",
    statusCheckStatus: "error",
    issueError: errorMessage,
  },
});

const createExsysSaveApiParams = ({
  primaryKey,
  exsysDataApiPrimaryKeyName,
  nphiesExtractedData: {
    bundleId,
    statusCheckOutcome,
    creationBundleId,
    issueError,
    issueErrorCode,
    statusCheckResponseId,
    statusCheckRequestId,
  },
}) => {
  const _outcome =
    !statusCheckOutcome || !!issueError || !!issueErrorCode
      ? "error"
      : statusCheckOutcome;

  return {
    [exsysDataApiPrimaryKeyName]: primaryKey,
    bundle_id: bundleId,
    creation_bundle_id: creationBundleId,
    outcome: _outcome,
    status_check_response_id: statusCheckResponseId,
    status_check_request_id: statusCheckRequestId,
  };
};

const createNphiesStatusCheckPreauthOrClaimData = async ({ requestParams }) => {
  const { record_pk, request_type } = requestParams;

  const isClaimCancellationRequest =
    request_type === NPHIES_REQUEST_TYPES.CLAIM;

  const printFolderName = `statusCheck/${request_type}/${record_pk}`;

  const exsysDataApiPrimaryKeyName = isClaimCancellationRequest
    ? "claim_pk"
    : "preauth_pk";

  return await createBaseFetchExsysDataAndCallNphiesApi({
    exsysQueryApiId: queryExsysClaimOrPreauthStatusCheckData,
    exsysSaveApiId: saveExsysClaimOrPreauthStatusCheckData,
    requestParams,
    requestMethod: "GET",
    printFolderName,
    exsysDataApiPrimaryKeyName,
    createNphiesRequestPayloadFn,
    extractionFunctionsMap,
    setErrorIfExtractedDataFoundFn,
    createExsysSaveApiParams,
    createExsysErrorSaveApiBody,
  });
};

export default createNphiesStatusCheckPreauthOrClaimData;
