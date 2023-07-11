/*
 *
 * Helper: `fetchExsysPreauthorizationDataAndCallNphies`.
 *
 */
// import convertSupportInfoAttachmentUrlsToBase64 from "../nphiesHelpers/base/convertSupportInfoAttachmentUrlsToBase64.mjs";
import createBaseFetchExsysDataAndCallNphiesApi from "./createBaseFetchExsysDataAndCallNphiesApi.mjs";
import extractClaimResponseData from "../nphiesHelpers/extraction/extractClaimResponseData.mjs";
import extractCoverageEntryResponseData from "../nphiesHelpers/extraction/extractCoverageEntryResponseData.mjs";
import createNphiesRequestPayloadFn from "../nphiesHelpers/preauthorization/index.mjs";
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
  frontEndData,
}) => {
  const _frontEndData = frontEndData || {};

  // const { extraSupportInformationData, ...otherFrontData } = _frontEndData;
  // const curedExtraSupportInformationData =
  //   await convertSupportInfoAttachmentUrlsToBase64(extraSupportInformationData);

  // const exsysResultsData = {
  //   ...(result || {}),
  //   ..._frontEndData,
  //   // ...otherFrontData,
  //   // extraSupportInformationData: curedExtraSupportInformationData
  // };

  const createResultsDataFromExsysResponse = (result) => ({
    ...result,
    ..._frontEndData,
  });

  const {
    exsysQueryApiId,
    printFolderName,
    nphiesRequestName,
    exsysDataApiPrimaryKeyName,
    exsysSaveApiId,
  } = CONFIG_MAP[nphiesRequestType];

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
  });

  return result;
};

export default fetchExsysPreauthorizationDataAndCallNphies;
