/*
 *
 * Helper: `fetchExsysEligibilityDataAndCallNphies`.
 *
 */
import createBaseFetchExsysDataAndCallNphiesApi from "./createBaseFetchExsysDataAndCallNphiesApi.mjs";
import extractEligibilityResponseData from "../nphiesHelpers/extraction/extractEligibilityResponseData.mjs";
import extractCoverageData from "../nphiesHelpers/extraction/extractCoverageData.mjs";
import createNphiesRequestPayloadFn from "../nphiesHelpers/eligibility/index.mjs";
import { EXSYS_API_IDS_NAMES, NPHIES_RESOURCE_TYPES } from "../constants.mjs";

const { COVERAGE } = NPHIES_RESOURCE_TYPES;

const { queryExsysEligibilityData, saveNphiesResponseToExsys } =
  EXSYS_API_IDS_NAMES;

const extractionFunctionsMap = {
  CoverageEligibilityResponse: extractEligibilityResponseData,
  [COVERAGE]: extractCoverageData,
};

const setErrorIfExtractedDataFoundFn = ({
  eligibilityErrors,
  coverageErrors,
}) => [eligibilityErrors, coverageErrors].flat().filter(Boolean);

const createResultsDataFromExsysResponse = ({ primaryKey, data }) => ({
  primaryKey,
  ...(data || null),
});

const createExsysErrorSaveApiBody = (errorMessage) => ({
  nphiesExtractedData: {
    eligibilityOutcome: "error",
    isPatientEligible: "N",
    eligibilityDisposition: errorMessage,
  },
});

const createExsysSaveApiParams = ({
  primaryKey,
  exsysDataApiPrimaryKeyName,
  nphiesExtractedData: { creationBundleId },
}) => ({
  [exsysDataApiPrimaryKeyName]: primaryKey,
  creation_bundle_id: creationBundleId,
});

const fetchExsysEligibilityDataAndCallNphies = async ({
  requestParams,
  exsysApiId,
  requestMethod,
  exsysAPiBodyData,
  noPatientDataLogger,
  printFolderName,
}) =>
  await createBaseFetchExsysDataAndCallNphiesApi({
    exsysQueryApiId: exsysApiId || queryExsysEligibilityData,
    exsysSaveApiId: saveNphiesResponseToExsys,
    requestParams,
    requestBody: exsysAPiBodyData,
    requestMethod,
    printFolderName: printFolderName || "eligibility",
    exsysDataApiPrimaryKeyName: "primaryKey",
    createResultsDataFromExsysResponse,
    createNphiesRequestPayloadFn,
    createExsysSaveApiParams,
    extractionFunctionsMap,
    setErrorIfExtractedDataFoundFn,
    createExsysErrorSaveApiBody,
    noPatientDataLogger,
  });

export default fetchExsysEligibilityDataAndCallNphies;
