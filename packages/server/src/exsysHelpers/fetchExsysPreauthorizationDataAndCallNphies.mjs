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
    claimRequestId,
    claimResponseId,
    claimOutcome,
    claimExtensionCode,
  },
}) => ({
  [exsysDataApiPrimaryKeyName]: primaryKey,
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
    printFolderName: "claim",
    nphiesRequestName: "Claim",
    exsysDataApiPrimaryKeyName: "claim_pk",
    exsysQueryApiId: collectExsysClaimData,
    exsysSaveApiId: saveClaimData,
  },
  [NPHIES_REQUEST_TYPES.PREAUTH]: {
    printFolderName: "preauthorization",
    nphiesRequestName: "Preauth",
    exsysDataApiPrimaryKeyName: "preauth_pk",
    exsysQueryApiId: collectExsysPreauthData,
    exsysSaveApiId: savePreauthData,
  },
};

const fetchExsysPreauthorizationDataAndCallNphies = async ({
  requestParams,
  requestMethod,
  printValues = true,
  nphiesRequestType,
}) => {
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

  const {
    exsysQueryApiId,
    printFolderName,
    nphiesRequestName,
    exsysDataApiPrimaryKeyName,
    exsysSaveApiId,
  } = CONFIG_MAP[nphiesRequestType];

  const { authorization } = requestParams;

  const onNphiesResponseWithSuccessFn = async (options) => {
    const {
      claimRequestId,
      claimPreauthRef,
      claimOutcome,
      claimResponseId,
      productsData,
    } = nphiesExtractedData || {};

    if (
      claimRequestId &&
      claimResponseId &&
      claimPreauthRef &&
      isArrayHasData(productsData)
    ) {
      await savePreauthPollDataToExsys({
        authorization,
        ...options,
      });
    }
  };

  const result = await createBaseFetchExsysDataAndCallNphiesApi({
    exsysQueryApiId,
    exsysSaveApiId,
    requestParams,
    requestMethod,
    printValues,
    printFolderName,
    nphiesRequestName,
    exsysDataApiPrimaryKeyName,
    createResultsDataFromExsysResponse,
    createNphiesRequestPayloadFn,
    extractionFunctionsMap,
    setErrorIfExtractedDataFoundFn,
    createExsysSaveApiParams,
    createExsysErrorSaveApiBody,
    onNphiesResponseWithSuccessFn,
  });

  return result;
};

export default fetchExsysPreauthorizationDataAndCallNphies;
