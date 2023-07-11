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

const { collectExsysPreauthData, collectExsysClaimData, savePreauthData } =
  EXSYS_API_IDS_NAMES;

const extractionFunctionsMap = {
  [COVERAGE]: extractCoverageEntryResponseData,
  ClaimResponse: extractClaimResponseData,
};

const setErrorIfExtractedDataFoundFn = ({ coverageErrors, claimErrors }) => [
  ...(coverageErrors || []),
  ...(claimErrors || []),
];

const createExsysSaveApiParams = (
  primaryKey,
  { claimRequestId, claimResponseId, claimOutcome, claimExtensionCode }
) => ({
  preauth_pk: primaryKey,
  request_preauth_id: claimRequestId,
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
    exsysDataApiPrimaryKeyName: "episode_invoice_no",
    exsysQueryApiId: collectExsysClaimData,
    exsysSaveApiId: "",
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
