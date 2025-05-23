/*
 *
 * Helper: `fetchExsysEligibilityDataAndCallNphies`.
 *
 */
import createBaseFetchExsysDataAndCallNphiesApi from "./createBaseFetchExsysDataAndCallNphiesApi.mjs";
import createNphiesRequestPayloadFn from "../nphiesHelpers/eligibility/index.mjs";
import { EXSYS_API_IDS_NAMES, NPHIES_REQUEST_TYPES } from "../constants.mjs";

const { ELIGIBILITY } = NPHIES_REQUEST_TYPES;

const { queryExsysEligibilityData, saveNphiesResponseToExsys } =
  EXSYS_API_IDS_NAMES;

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
  extraDataSavingToExsys: _extraDataSavingToExsys,
}) => {
  const {
    organization_no,
    organizationNo,
    clinicalEntityNo,
    patient_file_no,
    memberid,
    patient_contracts_seq,
    contract_no,
    episode_no,
  } = requestParams || exsysAPiBodyData || {};

  const extraDataSavingToExsys = {
    ...(_extraDataSavingToExsys || null),
    organization_no: organization_no || organizationNo,
    clinicalEntityNo,
    patient_file_no,
    patient_id_no: memberid,
    patient_contracts_seq,
    contract_no,
    episode_no,
  };

  return await createBaseFetchExsysDataAndCallNphiesApi({
    exsysQueryApiId: exsysApiId || queryExsysEligibilityData,
    exsysSaveApiId: saveNphiesResponseToExsys,
    extraDataSavingToExsys,
    requestParams,
    requestBody: exsysAPiBodyData,
    requestMethod,
    extractionRequestType: ELIGIBILITY,
    printFolderName: printFolderName || "eligibility",
    exsysDataApiPrimaryKeyName: "primaryKey",
    createResultsDataFromExsysResponse,
    createNphiesRequestPayloadFn,
    createExsysSaveApiParams,
    setErrorIfExtractedDataFoundFn,
    createExsysErrorSaveApiBody,
    noPatientDataLogger,
  });
};
export default fetchExsysEligibilityDataAndCallNphies;
