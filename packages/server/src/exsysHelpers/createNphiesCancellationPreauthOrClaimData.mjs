/*
 *
 * Helper: `createNphiesCancellationPreauthOrClaimData`.
 *
 */
import createBaseFetchExsysDataAndCallNphiesApi from "./createBaseFetchExsysDataAndCallNphiesApi.mjs";
import createNphiesRequestPayloadFnFactory from "../nphiesHelpers/preauthorization/createNphiesPreauthOrClaimCancellationData.mjs";
import { EXSYS_API_IDS_NAMES, NPHIES_REQUEST_TYPES } from "../constants.mjs";

const { CLAIM, CANCEL, ADVANCED_AUTHORIZATION } = NPHIES_REQUEST_TYPES;

const {
  queryClaimOrPreauthDataToCancellation,
  savePreauthData,
  saveClaimData,
} = EXSYS_API_IDS_NAMES;

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
  exsysDataApiPrimaryKeyName,
  requestParams,
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

  const { request_type } = requestParams;

  return {
    [exsysDataApiPrimaryKeyName]: primaryKey,
    bundle_id: bundleId,
    outcome: _outcome,
    creation_bundle_id: creationBundleId,
    request_type:
      request_type === ADVANCED_AUTHORIZATION
        ? `cancel-${ADVANCED_AUTHORIZATION}`
        : "cancel",
  };
};

const createNphiesCancellationPreauthOrClaimData = async ({
  requestParams,
}) => {
  const { record_pk, request_type, nullify_request } = requestParams;

  const isClaimCancellationRequest = request_type === CLAIM;

  const printFolderName = `cancellation/${request_type}/${record_pk}`;

  const exsysSaveApiId = isClaimCancellationRequest
    ? saveClaimData
    : savePreauthData;

  const exsysDataApiPrimaryKeyName = isClaimCancellationRequest
    ? "claim_pk"
    : "preauth_pk";

  const noReqTextForIdentifier = request_type === ADVANCED_AUTHORIZATION;

  return await createBaseFetchExsysDataAndCallNphiesApi({
    exsysQueryApiId: queryClaimOrPreauthDataToCancellation,
    exsysSaveApiId,
    requestParams,
    requestMethod: "GET",
    printFolderName,
    exsysDataApiPrimaryKeyName,
    createNphiesRequestPayloadFn: createNphiesRequestPayloadFnFactory(
      nullify_request,
      noReqTextForIdentifier
    ),
    extractionRequestType: CANCEL,
    setErrorIfExtractedDataFoundFn,
    createExsysSaveApiParams,
    createExsysErrorSaveApiBody,
  });
};

export default createNphiesCancellationPreauthOrClaimData;
