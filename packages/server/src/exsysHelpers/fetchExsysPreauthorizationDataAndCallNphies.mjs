/*
 *
 * Helper: `fetchExsysPreauthorizationDataAndCallNphies`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
import convertSupportInfoAttachmentUrlsToBase64 from "../nphiesHelpers/base/convertSupportInfoAttachmentUrlsToBase64.mjs";
import createBaseFetchExsysDataAndCallNphiesApi from "./createBaseFetchExsysDataAndCallNphiesApi.mjs";
import extractClaimResponseData from "../nphiesHelpers/extraction/extractClaimResponseData.mjs";
import extractCoverageEntryResponseData from "../nphiesHelpers/extraction/extractCoverageEntryResponseData.mjs";
import createNphiesRequestPayloadFn from "../nphiesHelpers/preauthorization/index.mjs";
import validateSupportInfoDataBeforeCallingNphies from "../nphiesHelpers/base/validateSupportInfoDataBeforeCallingNphies.mjs";
import savePreauthPollDataToExsys from "../polls/savePreauthPollDataToExsys.mjs";
import {
  EXSYS_API_IDS_NAMES,
  NPHIES_RESOURCE_TYPES,
  NPHIES_REQUEST_TYPES,
} from "../constants.mjs";

const { COVERAGE } = NPHIES_RESOURCE_TYPES;

const {
  collectExsysPreauthData,
  collectExsysClaimData,
  savePreauthData,
  saveClaimData,
} = EXSYS_API_IDS_NAMES;

const extractionFunctionsMap = {
  [COVERAGE]: extractCoverageEntryResponseData,
  ClaimResponse: extractClaimResponseData,
};

const setErrorIfExtractedDataFoundFn = ({ coverageErrors, claimErrors }) => [
  ...(coverageErrors || []),
  ...(claimErrors || []),
];

const createExsysSaveApiParams = ({
  primaryKey,
  exsysDataApiPrimaryKeyName,
  nphiesExtractedData: {
    issueError,
    issueErrorCode,
    bundleId,
    claimRequestId,
    claimResponseId,
    claimOutcome,
    claimExtensionCode,
    creationBundleId,
  },
}) => {
  const _outcome =
    !claimOutcome || !!issueError || !!issueErrorCode ? "error" : claimOutcome;

  return {
    [exsysDataApiPrimaryKeyName]: primaryKey,
    bundle_id: bundleId,
    claim_request_id: claimRequestId,
    claim_response_id: claimResponseId,
    outcome: _outcome,
    adjudication_outcome: claimExtensionCode || _outcome,
    creation_bundle_id: creationBundleId,
    request_type: "request",
  };
};

const createExsysErrorSaveApiBody = (errorMessage) => ({
  nphiesExtractedData: {
    claimOutcome: "error",
    issueError: errorMessage,
  },
});

const CONFIG_MAP = {
  [NPHIES_REQUEST_TYPES.CLAIM]: {
    exsysDataApiPrimaryKeyName: "claim_pk",
    exsysQueryApiId: collectExsysClaimData,
    exsysSaveApiId: saveClaimData,
  },
  [NPHIES_REQUEST_TYPES.PREAUTH]: {
    exsysDataApiPrimaryKeyName: "preauth_pk",
    exsysQueryApiId: collectExsysPreauthData,
    exsysSaveApiId: savePreauthData,
  },
};

const createResultsDataFromExsysResponse = async ({
  productsData,
  supportInformationData,
  ...result
}) => ({
  ...result,
  supportInformationData: await convertSupportInfoAttachmentUrlsToBase64(
    supportInformationData
  ),
  productsData: isArrayHasData(productsData)
    ? productsData.filter(Boolean)
    : [],
});

const fetchExsysPreauthorizationDataAndCallNphies = async ({
  requestParams,
  nphiesRequestType,
  exsysQueryApiDelayTimeout,
  nphiesApiDelayTimeout,
}) => {
  const { exsysQueryApiId, exsysDataApiPrimaryKeyName, exsysSaveApiId } =
    CONFIG_MAP[nphiesRequestType];

  const { authorization } = requestParams;

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
        requestType: nphiesRequestType,
        ...options,
      });
    }
  };

  const isClaimRequestType = nphiesRequestType === NPHIES_REQUEST_TYPES.CLAIM;

  const checkExsysDataValidationBeforeCallingNphies =
    validateSupportInfoDataBeforeCallingNphies(
      "supportInformationData",
      isClaimRequestType
    );

  return await createBaseFetchExsysDataAndCallNphiesApi({
    exsysQueryApiId,
    exsysSaveApiId,
    requestParams,
    requestMethod: "GET",
    printFolderName: nphiesRequestType,
    exsysDataApiPrimaryKeyName,
    createResultsDataFromExsysResponse,
    createNphiesRequestPayloadFn,
    extractionFunctionsMap,
    setErrorIfExtractedDataFoundFn,
    createExsysSaveApiParams,
    createExsysErrorSaveApiBody,
    onNphiesResponseWithSuccessFn,
    checkExsysDataValidationBeforeCallingNphies,
    exsysQueryApiDelayTimeout,
    nphiesApiDelayTimeout,
  });
};

export default fetchExsysPreauthorizationDataAndCallNphies;
