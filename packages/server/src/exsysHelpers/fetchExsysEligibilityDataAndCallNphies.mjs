/*
 *
 * Helper: `fetchExsysEligibilityDataAndCallNphies`.
 *
 */
import createBaseFetchExsysDataAndCallNphiesApi from "./createBaseFetchExsysDataAndCallNphiesApi.mjs";
import extractCoverageEligibilityEntryResponseData from "../nphiesHelpers/extraction/extractCoverageEligibilityEntryResponseData.mjs";
import extractCoverageEntryResponseData from "../nphiesHelpers/extraction/extractCoverageEntryResponseData.mjs";
import createNphiesRequestPayloadFn from "../nphiesHelpers/eligibility/index.mjs";
import { EXSYS_API_IDS_NAMES, NPHIES_RESOURCE_TYPES } from "../constants.mjs";

const { COVERAGE } = NPHIES_RESOURCE_TYPES;

const { getExsysDataBasedPatient, saveNphiesResponseToExsys } =
  EXSYS_API_IDS_NAMES;

const extractionFunctionsMap = {
  CoverageEligibilityResponse: extractCoverageEligibilityEntryResponseData,
  [COVERAGE]: extractCoverageEntryResponseData,
};

const setErrorIfExtractedDataFoundFn = ({
  eligibilityErrors,
  coverageErrors,
}) => [...(eligibilityErrors || []), ...(coverageErrors || [])];

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

const fetchExsysEligibilityDataAndCallNphies = async ({
  requestParams,
  exsysApiId,
  requestMethod,
  exsysAPiBodyData,
}) =>
  await createBaseFetchExsysDataAndCallNphiesApi({
    exsysQueryApiId: exsysApiId || getExsysDataBasedPatient,
    exsysSaveApiId: saveNphiesResponseToExsys,
    requestParams,
    requestBody: exsysAPiBodyData,
    requestMethod,
    printFolderName: "eligibility",
    nphiesRequestName: "Eligibility",
    exsysDataApiPrimaryKeyName: "primaryKey",
    createResultsDataFromExsysResponse,
    createNphiesRequestPayloadFn,
    extractionFunctionsMap,
    setErrorIfExtractedDataFoundFn,
    createExsysErrorSaveApiBody,
  });

export default fetchExsysEligibilityDataAndCallNphies;
