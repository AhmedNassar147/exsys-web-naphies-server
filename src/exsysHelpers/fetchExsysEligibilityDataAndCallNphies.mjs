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
  RETRY_TIMES,
} from "../constants.mjs";

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

const callNphiesAPIAndCollectResults = async (options, retryTimes) => {
  const { nphiesDataCreatedFromExsysData, primaryKey } = options;
  const nphiesResults = await createNphiesRequest({
    bodyData: nphiesDataCreatedFromExsysData,
  });

  const { isSuccess, result: nphiesResponse, ...restResult } = nphiesResults;

  let allResultData = {
    isSuccess,
    ...restResult,
    primaryKey,
    nodeServerDataSentToNaphies: nphiesDataCreatedFromExsysData,
    nphiesResponse,
  };

  const extractedData = mapEntriesAndExtractNeededData(nphiesResponse, {
    CoverageEligibilityResponse: extractCoverageEligibilityEntryResponseData,
    Coverage: extractCoverageEntryResponseData,
  });

  allResultData.nphiesExtractedData = extractedData;

  let shouldReloadApiDataCreation = false;

  if (extractedData) {
    const {
      CoverageEligibilityResponse: { errorCode, error },
    } = extractedData;
    // "errorCode": "GE-00012"
    // "error": "Payer is unreachable or temporarily offline, Please try again in a moment. If issue persists please follow up with the payer contact center."
    // "errorCode": "BV-00542"
    // "error": "NPHIES has already received and is currently processing a message for which this message is a duplicate",
    // "errorCode": "GE-00026"
    // "error": "The HIC unable to process your message, for more information please contact the payer.",
    // "errorCode": "BV-00163"
    // "error": "The main resource identifier SHALL be unique on the HCP/HIC level",
    shouldReloadApiDataCreation = [
      "GE-00012",
      "BV-00542",
      "GE-00026",
      "BV-00163",
    ].includes(errorCode);

    if (shouldReloadApiDataCreation) {
      console.log(
        `----ReloadApiDataCreation---- in ${RETRY_DELAY / 1000} seconds`
      );
      console.log({
        primaryKey,
        errorCode,
        error,
      });
    }
  }

  if (shouldReloadApiDataCreation && retryTimes > 0) {
    setTimeout(
      async () => await callNphiesAPIAndCollectResults(options, retryTimes - 1),
      RETRY_DELAY
    );
    return;
  }

  return allResultData;
};

const fetchExsysEligibilityDataAndCallNphies = async ({ exsysAPiBodyData }) => {
  const { isSuccess, result } = await createExsysRequest({
    resourceName: EXSYS_API_IDS_NAMES.createNphiesRequest,
    body: exsysAPiBodyData,
  });

  const { patient_file_no, message_event_type } = exsysAPiBodyData;

  if (isSuccess) {
    const { primaryKey, data } = result;

    const nphiesDataCreatedFromExsysData = getNphiesDataCreatedFromExsysData({
      ...data,
      message_event_type,
      patientFileNo: patient_file_no,
      business_arrangement: undefined,
      network_name: undefined,
      classes: undefined,
    });

    const nphiesResultData = await callNphiesAPIAndCollectResults(
      { nphiesDataCreatedFromExsysData, primaryKey },
      RETRY_TIMES
    );

    await writeResultFile(nphiesResultData);
  }
};

export default fetchExsysEligibilityDataAndCallNphies;