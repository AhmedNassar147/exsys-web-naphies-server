/*
 *
 * Helper: `fetchExsysEligibilityDataAndCallNphies`.
 *
 */
import createExsysRequest from "../helpers/createExsysRequest.mjs";
import createNphiesRequest from "../helpers/createNphiesRequest.mjs";
import createUUID from "../nodeHelpers/createUUID.mjs";
import writeResultFile from "../nodeHelpers/writeResultFile.mjs";
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

        // "errorCode": "GE-00012"
        // "error": "Payer is unreachable or temporarily offline, Please try again in a moment. If issue persists please follow up with the payer contact center."
        // "errorCode": "BV-00542"
        // "error": "NPHIES has already received and is currently processing a message for which this message is a duplicate",
        // "errorCode": "BV-00163"
        // "error": "The main resource identifier SHALL be unique on the HCP/HIC level",
        // "errorCode": "GE-00026" => send to front end
        // "error": "The HIC unable to process your message, for more information please contact the payer.",
        // "errorCode": "GE-00010",
        // "error": "The HIC/TPA you are trying to access is not onboarded/active on nphies",
        shouldReloadApiDataCreation = [
          "GE-00012",
          "BV-00542",
          "BV-00163",
        ].includes(errorCode);

        if (!hasError) {
          hasError = [
            errorCode,
            error,
            coverageErrorCode,
            coverageError,
            issueErrorCode,
            issueError,
          ].some((value) => !!value);

          errorMessage = [error, coverageError, issueError].join(" , ");
          errorMessageCode = [
            errorCode,
            coverageErrorCode,
            issueErrorCode,
          ].join(" , ");
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
  exsysAPiBodyData,
  printValues = true,
}) => {
  const { isSuccess, result } = await createExsysRequest({
    resourceName: EXSYS_API_IDS_NAMES.createNphiesRequest,
    body: exsysAPiBodyData,
  });

  const { primaryKey, data } = result || {};
  const { error_message } = data || {};

  if (error_message || !isSuccess) {
    console.error(`Exsys API failed with results`, {
      result,
      exsysAPiBodyData,
    });

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

    return {
      errorMessage:
        error_message ||
        `error with calling exsys \`${EXSYS_API_IDS_NAMES.createNphiesRequest}\` API`,
      hasError: true,
    };
  }

  const { patient_file_no, message_event_type } = exsysAPiBodyData;

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

  if (printValues) {
    await writeResultFile({
      data: nphiesResultData,
      isError: hasError,
    });
  }

  const { nphiesExtractedData } = nphiesResultData;
  const { CoverageEligibilityResponse } = nphiesExtractedData || {};
  const { isPatientEligible } = CoverageEligibilityResponse || {};

  return {
    nphiesExtractedData,
    isPatientEligible,
    errorMessage,
    errorMessageCode,
    hasError,
  };
};

export default fetchExsysEligibilityDataAndCallNphies;
