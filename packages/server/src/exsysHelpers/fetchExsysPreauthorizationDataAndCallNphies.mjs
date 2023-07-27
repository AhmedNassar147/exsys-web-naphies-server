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
import savePreauthPollDataToExsys from "../polls/savePreauthPollDataToExsys.mjs";
import {
  EXSYS_API_IDS_NAMES,
  NPHIES_RESOURCE_TYPES,
  NPHIES_REQUEST_TYPES,
  SUPPORT_INFO_KEY_NAMES,
} from "../constants.mjs";

const { COVERAGE } = NPHIES_RESOURCE_TYPES;
const { attachment } = SUPPORT_INFO_KEY_NAMES;

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
    bundleId,
    claimRequestId,
    claimResponseId,
    claimOutcome,
    claimExtensionCode,
  },
}) => ({
  [exsysDataApiPrimaryKeyName]: primaryKey,
  bundle_id: bundleId,
  claim_request_id: claimRequestId,
  claim_response_id: claimResponseId,
  outcome: claimOutcome,
  adjudication_outcome: claimExtensionCode,
});

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
  requestMethod,
  nphiesRequestType,
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

  const checkExsysDataValidationBeforeCallingNphies = ({
    supportInformationData,
  }) => {
    if (isArrayHasData(supportInformationData)) {
      const indexOfSomeAttachmentNotFound = supportInformationData.findIndex(
        ({ categoryCode, value }) => categoryCode === attachment && !value
      );

      const someAttachmentNotFound = indexOfSomeAttachmentNotFound !== -1;

      return someAttachmentNotFound
        ? `Skipping request because some attachments not found \`Index is\` => ${indexOfSomeAttachmentNotFound}`
        : undefined;
    }

    return undefined;
  };

  return await createBaseFetchExsysDataAndCallNphiesApi({
    exsysQueryApiId,
    exsysSaveApiId,
    requestParams,
    requestMethod,
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
  });
};

export default fetchExsysPreauthorizationDataAndCallNphies;
