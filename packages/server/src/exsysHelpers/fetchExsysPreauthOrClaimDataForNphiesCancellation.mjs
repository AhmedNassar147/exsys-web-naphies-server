/*
 *
 * Helper: `fetchExsysPreauthOrClaimDataForNphiesCancellation`.
 *
 */
import createBaseFetchExsysDataAndCallNphiesApi from "./createBaseFetchExsysDataAndCallNphiesApi.mjs";
import extractPreauthOrClaimCancellationResponseData from "../nphiesHelpers/extraction/extractPreauthOrClaimCancellationResponseData.mjs";
import createNphiesPreauthOrClaimCancellationData from "../nphiesHelpers/preauthorization/createNphiesPreauthOrClaimCancellationData.mjs";
import {
  EXSYS_API_IDS_NAMES,
  NPHIES_RESOURCE_TYPES,
  NPHIES_REQUEST_TYPES,
} from "../constants.mjs";

const { queryClaimRequestDataToCancellation, savePreauthData, saveClaimData } =
  EXSYS_API_IDS_NAMES;

const extractionFunctionsMap = {
  [NPHIES_RESOURCE_TYPES.TASK]: extractPreauthOrClaimCancellationResponseData,
};

const setErrorIfExtractedDataFoundFn = ({ cancellationErrors }) =>
  cancellationErrors || [];

const createExsysSaveApiParams = ({
  primaryKey,
  exsysDataApiPrimaryKeyName,
  nphiesExtractedData: { bundleId, cancellationStatus, creationBundleId },
}) => ({
  [exsysDataApiPrimaryKeyName]: primaryKey,
  bundle_id: bundleId,
  outcome: cancellationStatus,
  creation_bundle_id: creationBundleId,
  request_type: "cancel",
});

const createExsysErrorSaveApiBody = (errorMessage) => ({
  nphiesExtractedData: {
    cancellationOutcome: "error",
    cancellationStatus: "error",
    issueError: errorMessage,
  },
});

const CONFIG_MAP = {
  [NPHIES_REQUEST_TYPES.CLAIM]: {
    exsysDataApiPrimaryKeyName: "claim_pk",
    exsysQueryApiId: queryClaimRequestDataToCancellation,
    printFolderName: "claimCancellation",
    exsysSaveApiId: saveClaimData,
  },
  [NPHIES_REQUEST_TYPES.PREAUTH]: {
    exsysDataApiPrimaryKeyName: "preauth_pk",
    // exsysQueryApiId: collectExsysPreauthData,
    exsysSaveApiId: savePreauthData,
    printFolderName: "preauthCancellation",
  },
};

const fetchExsysPreauthOrClaimDataForNphiesCancellation = async ({
  requestParams,
  requestMethod,
  nphiesRequestType,
}) => {
  const {
    exsysQueryApiId,
    exsysDataApiPrimaryKeyName,
    exsysSaveApiId,
    printFolderName,
  } = CONFIG_MAP[nphiesRequestType];

  return await createBaseFetchExsysDataAndCallNphiesApi({
    exsysQueryApiId,
    exsysSaveApiId,
    requestParams,
    requestMethod,
    printFolderName,
    exsysDataApiPrimaryKeyName,
    createNphiesRequestPayloadFn: createNphiesPreauthOrClaimCancellationData,
    extractionFunctionsMap,
    setErrorIfExtractedDataFoundFn,
    createExsysSaveApiParams,
    createExsysErrorSaveApiBody,
  });
};

export default fetchExsysPreauthOrClaimDataForNphiesCancellation;
