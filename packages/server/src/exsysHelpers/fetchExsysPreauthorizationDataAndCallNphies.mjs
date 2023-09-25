/*
 *
 * Helper: `fetchExsysPreauthorizationDataAndCallNphies`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
import createExsysRequest from "../helpers/createExsysRequest.mjs";
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
  saveClaimHistory,
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
  isSizeLimitExceeded,
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
    size_limit_exceeded: isSizeLimitExceeded ? "Y" : "N",
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
}) => {
  const { exsysQueryApiId, exsysDataApiPrimaryKeyName, exsysSaveApiId } =
    CONFIG_MAP[nphiesRequestType];

  const { authorization } = requestParams;
  const isClaimRequestType = nphiesRequestType === NPHIES_REQUEST_TYPES.CLAIM;

  const onNphiesResponseWithSuccessFn = async ({
    nphiesExtractedData,
    isSizeLimitExceeded,
    ...options
  }) => {
    const { nodeServerDataSentToNaphies, nphiesResponse, exsysResultsData } =
      options;

    const { claim_pk } = exsysResultsData || {};

    if (isClaimRequestType && claim_pk) {
      await createExsysRequest({
        resourceName: saveClaimHistory,
        requestMethod: "POST",
        requestParams: {
          claim_pk,
          size_limit_exceeded: isSizeLimitExceeded ? "Y" : "N",
        },
        body: {
          claim_pk,
          nodeServerDataSentToNaphies,
          nphiesResponse,
          nphiesExtractedData,
        },
      });
    }

    const { claimRequestId, claimPreauthRef, claimResponseId, productsData } =
      nphiesExtractedData || {};

    if (
      nphiesExtractedData &&
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
    checkPayloadNphiesSize: isClaimRequestType,
  });
};

export default fetchExsysPreauthorizationDataAndCallNphies;
