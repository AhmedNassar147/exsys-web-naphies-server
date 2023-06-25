/*
 *
 * Helper: `fetchExsysEligibilityDataAndCallNphies`.
 *
 */
import { createUUID, writeResultFile } from "@exsys-web-server/helpers";
import createExsysRequest from "../helpers/createExsysRequest.mjs";
import createNphiesRequest from "../helpers/createNphiesRequest.mjs";
import mapEntriesAndExtractNeededData from "../nphiesHelpers/extraction/mapEntriesAndExtractNeededData.mjs";
import extractCoverageEligibilityEntryResponseData from "../nphiesHelpers/extraction/extractCoverageEligibilityEntryResponseData.mjs";
import extractCoverageEntryResponseData from "../nphiesHelpers/extraction/extractCoverageEntryResponseData.mjs";
import createNaphiesRequestFullData from "../nphiesHelpers/eligibility/index.mjs";
import {
  ELIGIBILITY_TYPES,
  EXSYS_API_IDS_NAMES,
  RETRY_DELAY,
  NPHIES_RETRY_TIMES,
  NPHIES_RESOURCE_TYPES,
} from "../constants.mjs";

const { COVERAGE } = NPHIES_RESOURCE_TYPES;

const BENEFITS_AND_VALIDATION_TYPE = [
  ELIGIBILITY_TYPES.benefits,
  ELIGIBILITY_TYPES.validation,
];

const { getExsysDataBasedPatient, saveNphiesResponseToExsys } =
  EXSYS_API_IDS_NAMES;

const getNphiesDataCreatedFromExsysData = ({
  site_url,
  site_name,
  site_tel,
  official_name,
  official_f_name,
  provider_license,
  provider_organization,
  provider_location,
  location_license,
  payer_license,
  payer_organization,
  payer_name,
  memberid,
  iqama_no,
  gender,
  birthDate,
  period_start_date,
  period_end_date,
  payer_base_url,
  coverage_type,
  relationship,
  business_arrangement,
  network_name,
  classes,
  message_event_type,
  patientFileNo,
}) => {
  const purpose = BENEFITS_AND_VALIDATION_TYPE.includes(message_event_type)
    ? BENEFITS_AND_VALIDATION_TYPE
    : [message_event_type];

  return createNaphiesRequestFullData({
    provider_license,
    request_id: createUUID(),
    payer_license,
    site_url,
    site_tel,
    site_name,
    provider_organization,
    payer_organization,
    payer_name,
    provider_location,
    location_license,
    payer_base_url: payer_base_url || "http://payer.com",
    purpose,
    coverage_type: coverage_type || "EHCPOL",
    member_id: memberid,
    patient_id: patientFileNo,
    national_id_type: "PRC",
    national_id: iqama_no,
    staff_first_name: official_name,
    staff_family_name: official_f_name,
    gender: gender,
    birthDate: birthDate,
    patient_martial_status: undefined,
    relationship: relationship || "self",
    period_start_date,
    period_end_date,
    business_arrangement,
    network_name,
    classes,
  });
};

const callNphiesAPIAndCollectResults = ({
  retryTimes,
  exsysResultsData,
  primaryKey,
}) =>
  new Promise(async (resolve) => {
    const wrapper = async (_retryTimes) => {
      const nphiesDataCreatedFromExsysData =
        getNphiesDataCreatedFromExsysData(exsysResultsData);

      const nphiesResults = await createNphiesRequest({
        bodyData: nphiesDataCreatedFromExsysData,
      });

      const {
        isSuccess,
        result: nphiesResponse,
        ...restResult
      } = nphiesResults;

      let nphiesResultData = {
        isSuccess,
        ...restResult,
        primaryKey,
        exsysResultsData,
        nodeServerDataSentToNaphies: nphiesDataCreatedFromExsysData,
        nphiesResponse,
      };

      let hasError = !isSuccess;
      let errorMessage = restResult.error;
      let errorMessageCode = undefined;

      const extractedData = mapEntriesAndExtractNeededData(nphiesResponse, {
        CoverageEligibilityResponse:
          extractCoverageEligibilityEntryResponseData,
        [COVERAGE]: extractCoverageEntryResponseData,
      });

      nphiesResultData.nphiesExtractedData = extractedData;

      let shouldReloadApiDataCreation = false;

      if (extractedData) {
        const {
          CoverageEligibilityResponse: coverageEligibilityResponse,
          [COVERAGE]: coverageEntry,
          errorCode: issueErrorCode,
          error: issueError,
        } = extractedData;

        const { errorCode, error } = coverageEligibilityResponse || {};
        const { errorCode: coverageErrorCode, error: coverageError } =
          coverageEntry || {};

        shouldReloadApiDataCreation = [
          "GE-00012",
          "BV-00542",
          "BV-00163",
        ].includes(errorCode);

        if (!hasError) {
          const errors = [error, coverageError, issueError].filter(Boolean);
          const errorCodes = [
            errorCode,
            coverageErrorCode,
            issueErrorCode,
          ].filter(Boolean);

          hasError = [...errors, ...errorCodes].some((value) => !!value);

          errorMessage = errors.join(" , ");
          errorMessageCode = errorCodes.join(" , ");
        }
      }

      const shouldReloadWithFoundRetryTime =
        shouldReloadApiDataCreation && _retryTimes > 0;

      if (shouldReloadWithFoundRetryTime) {
        console.log(
          `--ReloadApiDataCreation-- in ${RETRY_DELAY / 1000} seconds`
        );
        setTimeout(async () => await wrapper(_retryTimes - 1), RETRY_DELAY);
        return;
      }

      resolve({ nphiesResultData, hasError, errorMessage, errorMessageCode });
    };
    await wrapper(retryTimes);
  });

const fetchExsysEligibilityDataAndCallNphies = async ({
  requestParams,
  exsysApiId,
  requestMethod,
  exsysAPiBodyData,
  printValues = true,
}) => {
  const { isSuccess, result } = await createExsysRequest({
    resourceName: exsysApiId || getExsysDataBasedPatient,
    body: exsysAPiBodyData,
    requestMethod,
    requestParams,
  });

  const { primaryKey, data } = result || {};
  const { error_message, patient_file_no, message_event_type } = data || {};

  if (error_message || !isSuccess) {
    console.error("Exsys API failed");

    if (printValues) {
      await writeResultFile({
        data: {
          primaryKey,
          exsysResultsData: data,
          exsysAPiBodyData,
        },
        isError: true,
      });
    }

    const errorMessage =
      error_message ||
      `error calling exsys \`${getExsysDataBasedPatient}\` API`;

    return {
      errorMessage,
      hasError: true,
    };
  }

  if (!primaryKey || !data) {
    console.error("Exsys API failed sent empty primaryKey or data keys");
    return {};
  }

  const { nphiesResultData, hasError, errorMessage, errorMessageCode } =
    await callNphiesAPIAndCollectResults({
      exsysResultsData: {
        ...data,
        message_event_type,
        patientFileNo: patient_file_no,
        business_arrangement: undefined,
        network_name: undefined,
        classes: undefined,
      },
      primaryKey,
      retryTimes: NPHIES_RETRY_TIMES,
    });

  const { nphiesExtractedData, nodeServerDataSentToNaphies, nphiesResponse } =
    nphiesResultData;
  const { CoverageEligibilityResponse } = nphiesExtractedData || {};
  const { isPatientEligible, responseId } = CoverageEligibilityResponse || {};

  await createExsysRequest({
    resourceName: saveNphiesResponseToExsys,
    body: {
      primaryKey,
      nodeServerDataSentToNaphies,
      nphiesResponse,
      nphiesExtractedData,
    },
  });

  if (printValues) {
    await writeResultFile({
      data: nphiesResultData,
      isError: hasError,
    });
  }

  return {
    primaryKey,
    eligibilityResponseId: responseId,
    nphiesExtractedData,
    isPatientEligible,
    errorMessage,
    errorMessageCode,
    hasError,
  };
};

export default fetchExsysEligibilityDataAndCallNphies;
